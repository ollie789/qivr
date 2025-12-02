using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Qivr.Services.Security;

/// <summary>
/// Provides encryption/decryption for PHI message content using AES-256-GCM.
/// Keys are derived per-tenant using HKDF for tenant isolation.
/// </summary>
public interface IMessageEncryptionService
{
    /// <summary>
    /// Encrypts message content for storage.
    /// Returns base64-encoded ciphertext with embedded nonce and tag.
    /// </summary>
    string Encrypt(string plaintext, Guid tenantId);

    /// <summary>
    /// Decrypts message content from storage.
    /// </summary>
    string Decrypt(string ciphertext, Guid tenantId);

    /// <summary>
    /// Checks if a string appears to be encrypted (base64 with correct prefix).
    /// </summary>
    bool IsEncrypted(string content);
}

public class MessageEncryptionService : IMessageEncryptionService
{
    private readonly byte[] _masterKey;
    private readonly ILogger<MessageEncryptionService> _logger;

    // Encryption marker prefix to identify encrypted content
    private const string EncryptionPrefix = "ENC:";
    private const int NonceSize = 12;  // AES-GCM standard
    private const int TagSize = 16;    // AES-GCM standard
    private const int KeySize = 32;    // AES-256

    public MessageEncryptionService(IConfiguration configuration, ILogger<MessageEncryptionService> logger)
    {
        _logger = logger;

        // Master key from configuration (should be in AWS Secrets Manager in production)
        var masterKeyBase64 = configuration["Security:MessageEncryptionKey"];

        if (string.IsNullOrEmpty(masterKeyBase64))
        {
            // Generate a deterministic key for development (NOT for production!)
            _logger.LogWarning("Message encryption key not configured - using development fallback. Configure Security:MessageEncryptionKey for production.");
            _masterKey = SHA256.HashData(Encoding.UTF8.GetBytes("DEVELOPMENT_KEY_DO_NOT_USE_IN_PRODUCTION"));
        }
        else
        {
            _masterKey = Convert.FromBase64String(masterKeyBase64);
            if (_masterKey.Length != KeySize)
            {
                throw new InvalidOperationException($"Message encryption key must be {KeySize} bytes (256 bits)");
            }
        }
    }

    public string Encrypt(string plaintext, Guid tenantId)
    {
        if (string.IsNullOrEmpty(plaintext))
            return plaintext;

        try
        {
            // Derive tenant-specific key using HKDF
            var tenantKey = DeriveKeyForTenant(tenantId);

            var plaintextBytes = Encoding.UTF8.GetBytes(plaintext);
            var nonce = RandomNumberGenerator.GetBytes(NonceSize);
            var ciphertext = new byte[plaintextBytes.Length];
            var tag = new byte[TagSize];

            using var aesGcm = new AesGcm(tenantKey, TagSize);
            aesGcm.Encrypt(nonce, plaintextBytes, ciphertext, tag);

            // Combine: nonce + ciphertext + tag
            var result = new byte[NonceSize + ciphertext.Length + TagSize];
            Buffer.BlockCopy(nonce, 0, result, 0, NonceSize);
            Buffer.BlockCopy(ciphertext, 0, result, NonceSize, ciphertext.Length);
            Buffer.BlockCopy(tag, 0, result, NonceSize + ciphertext.Length, TagSize);

            return EncryptionPrefix + Convert.ToBase64String(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to encrypt message content");
            throw new InvalidOperationException("Message encryption failed", ex);
        }
    }

    public string Decrypt(string ciphertext, Guid tenantId)
    {
        if (string.IsNullOrEmpty(ciphertext))
            return ciphertext;

        // Check if content is encrypted
        if (!IsEncrypted(ciphertext))
        {
            // Return as-is for backward compatibility with unencrypted messages
            return ciphertext;
        }

        try
        {
            // Remove prefix and decode
            var encryptedData = Convert.FromBase64String(ciphertext.Substring(EncryptionPrefix.Length));

            if (encryptedData.Length < NonceSize + TagSize)
            {
                throw new InvalidOperationException("Invalid encrypted data format");
            }

            // Extract components
            var nonce = new byte[NonceSize];
            var tag = new byte[TagSize];
            var ciphertextBytes = new byte[encryptedData.Length - NonceSize - TagSize];

            Buffer.BlockCopy(encryptedData, 0, nonce, 0, NonceSize);
            Buffer.BlockCopy(encryptedData, NonceSize, ciphertextBytes, 0, ciphertextBytes.Length);
            Buffer.BlockCopy(encryptedData, NonceSize + ciphertextBytes.Length, tag, 0, TagSize);

            // Derive tenant-specific key
            var tenantKey = DeriveKeyForTenant(tenantId);

            var plaintextBytes = new byte[ciphertextBytes.Length];
            using var aesGcm = new AesGcm(tenantKey, TagSize);
            aesGcm.Decrypt(nonce, ciphertextBytes, tag, plaintextBytes);

            return Encoding.UTF8.GetString(plaintextBytes);
        }
        catch (CryptographicException ex)
        {
            _logger.LogError(ex, "Failed to decrypt message - possible key mismatch or tampering");
            throw new InvalidOperationException("Message decryption failed - content may be corrupted", ex);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to decrypt message content");
            throw new InvalidOperationException("Message decryption failed", ex);
        }
    }

    public bool IsEncrypted(string content)
    {
        return !string.IsNullOrEmpty(content) && content.StartsWith(EncryptionPrefix);
    }

    private byte[] DeriveKeyForTenant(Guid tenantId)
    {
        // Use HKDF to derive a unique key per tenant
        // This provides tenant isolation - compromising one tenant's messages
        // doesn't expose other tenants' data
        var tenantBytes = tenantId.ToByteArray();
        var info = Encoding.UTF8.GetBytes("message-encryption-v1");

        return HKDF.DeriveKey(
            HashAlgorithmName.SHA256,
            _masterKey,
            KeySize,
            salt: tenantBytes,
            info: info
        );
    }
}

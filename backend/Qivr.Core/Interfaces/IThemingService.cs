using System;
using System.Threading.Tasks;

namespace Qivr.Core.Interfaces
{
    public interface IThemingService
    {
        Task<TenantTheme> GetThemeAsync(Guid tenantId);
        Task<TenantTheme> GetThemeBySlugAsync(string slug);
        Task<bool> UpdateThemeAsync(Guid tenantId, TenantTheme theme);
        Task<WidgetConfiguration> GetWidgetConfigurationAsync(string clinicSlug);
    }

    public class TenantTheme
    {
        public Guid TenantId { get; set; }
        public string TenantName { get; set; }
        public ThemeColors Colors { get; set; }
        public ThemeTypography Typography { get; set; }
        public ThemeSpacing Spacing { get; set; }
        public ThemeBorderRadius BorderRadius { get; set; }
        public string LogoUrl { get; set; }
        public string FaviconUrl { get; set; }
        public string CustomCss { get; set; }
        public string HeaderHtml { get; set; }
        public string FooterHtml { get; set; }
    }

    public class ThemeColors
    {
        public string Primary { get; set; }
        public string Secondary { get; set; }
        public string Success { get; set; }
        public string Warning { get; set; }
        public string Error { get; set; }
        public string Info { get; set; }
        public string Background { get; set; }
        public string Surface { get; set; }
        public string Text { get; set; }
        public string TextSecondary { get; set; }
        public string Border { get; set; }
        public string Divider { get; set; }
        public string DarkBackground { get; set; }
        public string DarkSurface { get; set; }
        public string DarkText { get; set; }
        public string DarkTextSecondary { get; set; }
    }

    public class ThemeTypography
    {
        public string FontFamily { get; set; }
        public string HeadingFontFamily { get; set; }
        public string FontSizeBase { get; set; }
        public string FontWeightNormal { get; set; }
        public string FontWeightBold { get; set; }
        public string LineHeightBase { get; set; }
    }

    public class ThemeSpacing
    {
        public string BaseUnit { get; set; }
        public string Xs { get; set; }
        public string Sm { get; set; }
        public string Md { get; set; }
        public string Lg { get; set; }
        public string Xl { get; set; }
    }

    public class ThemeBorderRadius
    {
        public string None { get; set; }
        public string Sm { get; set; }
        public string Md { get; set; }
        public string Lg { get; set; }
        public string Full { get; set; }
    }

    public class WidgetConfiguration
    {
        public TenantTheme Theme { get; set; }
        public WidgetFeatures Features { get; set; }
        public WidgetBranding Branding { get; set; }
        public string ApiEndpoint { get; set; }
        public string WebSocketEndpoint { get; set; }
    }

    public class WidgetFeatures
    {
        public bool Enable3DBodyMap { get; set; }
        public bool EnableAISummary { get; set; }
        public bool EnableDirectBooking { get; set; }
        public bool EnablePainIntensity { get; set; }
        public bool RequireAuthentication { get; set; }
        public string[] SupportedLanguages { get; set; }
    }

    public class WidgetBranding
    {
        public bool ShowPoweredBy { get; set; }
        public string CustomCss { get; set; }
        public string HeaderHtml { get; set; }
        public string FooterHtml { get; set; }
    }
}

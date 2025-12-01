using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace Qivr.Api.Models;

/// <summary>
/// Request model for cursor-based pagination
/// </summary>
public class CursorPaginationRequest
{
    public string? Cursor { get; set; }
    public int Limit { get; set; } = 20;
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
    
    public int MaxLimit => 100;
    public int EffectiveLimit => Math.Min(Math.Max(1, Limit), MaxLimit);
}

/// <summary>
/// Response model for cursor-based pagination
/// </summary>
public class CursorPaginationResponse<T>
{
    public List<T> Items { get; set; } = new();
    public string? NextCursor { get; set; }
    public string? PreviousCursor { get; set; }
    public bool HasNext { get; set; }
    public bool HasPrevious { get; set; }
    public int Count { get; set; }
}

/// <summary>
/// Cursor information for encoding/decoding
/// </summary>
public class CursorInfo
{
    public object? LastValue { get; set; }
    public Guid? LastId { get; set; }
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

/// <summary>
/// Helper class for cursor-based pagination
/// </summary>
public static class CursorPaginationHelper
{
    /// <summary>
    /// Encode cursor information to base64 string
    /// </summary>
    public static string EncodeCursor(CursorInfo cursorInfo)
    {
        var json = JsonSerializer.Serialize(cursorInfo);
        var bytes = Encoding.UTF8.GetBytes(json);
        return Convert.ToBase64String(bytes);
    }

    /// <summary>
    /// Decode base64 cursor string to cursor information
    /// </summary>
    public static CursorInfo? DecodeCursor(string? cursor)
    {
        if (string.IsNullOrEmpty(cursor))
            return null;

        try
        {
            var bytes = Convert.FromBase64String(cursor);
            var json = Encoding.UTF8.GetString(bytes);
            return JsonSerializer.Deserialize<CursorInfo>(json);
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Apply cursor-based pagination to a queryable
    /// </summary>
    public static async Task<CursorPaginationResponse<T>> PaginateAsync<T, TKey>(
        IQueryable<T> query,
        Expression<Func<T, TKey>> sortKeySelector,
        Expression<Func<T, Guid>> idSelector,
        CursorPaginationRequest request,
        CancellationToken cancellationToken = default) where T : class
    {
        var cursorInfo = DecodeCursor(request.Cursor);
        var limit = request.EffectiveLimit;
        
        // Apply cursor filter if provided
        if (cursorInfo != null && cursorInfo.LastValue != null && cursorInfo.LastId != null)
        {
            var parameter = Expression.Parameter(typeof(T), "x");
            var sortProperty = sortKeySelector.Body.ToString().Split('.').Last();
            
            // Build cursor filter expression
            var sortValue = Expression.Property(parameter, sortProperty);
            var idValue = idSelector.Body is MemberExpression memberExpr 
                ? Expression.Property(parameter, memberExpr.Member.Name)
                : idSelector.Body;

            Expression filter;
            if (request.SortDescending)
            {
                // For descending: value < lastValue OR (value == lastValue AND id < lastId)
                var valueLessThan = Expression.LessThan(sortValue, Expression.Constant(cursorInfo.LastValue));
                var valueEqual = Expression.Equal(sortValue, Expression.Constant(cursorInfo.LastValue));
                var idLessThan = Expression.LessThan(idValue, Expression.Constant(cursorInfo.LastId));
                var combined = Expression.OrElse(valueLessThan, Expression.AndAlso(valueEqual, idLessThan));
                filter = Expression.Lambda<Func<T, bool>>(combined, parameter);
            }
            else
            {
                // For ascending: value > lastValue OR (value == lastValue AND id > lastId)
                var valueGreaterThan = Expression.GreaterThan(sortValue, Expression.Constant(cursorInfo.LastValue));
                var valueEqual = Expression.Equal(sortValue, Expression.Constant(cursorInfo.LastValue));
                var idGreaterThan = Expression.GreaterThan(idValue, Expression.Constant(cursorInfo.LastId));
                var combined = Expression.OrElse(valueGreaterThan, Expression.AndAlso(valueEqual, idGreaterThan));
                filter = Expression.Lambda<Func<T, bool>>(combined, parameter);
            }

            if (filter != null)
            {
                query = query.Where((Expression<Func<T, bool>>)filter);
            }
        }

        // Apply sorting
        query = request.SortDescending 
            ? query.OrderByDescending(sortKeySelector).ThenByDescending(idSelector)
            : query.OrderBy(sortKeySelector).ThenBy(idSelector);

        // Get items (fetch one extra to check if there's a next page)
        var items = await query.Take(limit + 1).ToListAsync(cancellationToken);
        
        var hasNext = items.Count > limit;
        if (hasNext)
        {
            items = items.Take(limit).ToList();
        }

        // Create response
        var response = new CursorPaginationResponse<T>
        {
            Items = items,
            Count = items.Count,
            HasNext = hasNext,
            HasPrevious = cursorInfo != null
        };

        // Generate next cursor if there are more items
        if (hasNext && items.Any())
        {
            var lastItem = items.Last();
            var sortFunc = sortKeySelector.Compile();
            var idFunc = idSelector.Compile();
            
            response.NextCursor = EncodeCursor(new CursorInfo
            {
                LastValue = sortFunc(lastItem),
                LastId = idFunc(lastItem),
                SortBy = request.SortBy,
                SortDescending = request.SortDescending,
                Timestamp = DateTime.UtcNow
            });
        }

        // For previous cursor, we'd need to implement reverse pagination
        // This is more complex and typically requires a separate query
        
        return response;
    }

    /// <summary>
    /// Simplified pagination for common scenarios (sorting by CreatedAt)
    /// </summary>
    public static async Task<CursorPaginationResponse<T>> PaginateByCreatedAtAsync<T>(
        IQueryable<T> query,
        Expression<Func<T, DateTime>> createdAtSelector,
        Expression<Func<T, Guid>> idSelector,
        CursorPaginationRequest request,
        CancellationToken cancellationToken = default) where T : class
    {
        return await PaginateAsync(query, createdAtSelector, idSelector, request, cancellationToken);
    }
}

/// <summary>
/// Extension methods for IQueryable to support cursor pagination
/// </summary>
public static class CursorPaginationExtensions
{
    public static async Task<CursorPaginationResponse<T>> ToCursorPageAsync<T>(
        this IQueryable<T> query,
        CursorPaginationRequest request,
        CancellationToken cancellationToken = default) where T : class
    {
        // Default implementation assumes entities have Id and CreatedAt properties
        var parameter = Expression.Parameter(typeof(T), "x");
        var idProperty = Expression.Property(parameter, "Id");
        var idSelector = Expression.Lambda<Func<T, Guid>>(idProperty, parameter);
        
        var createdAtProperty = Expression.Property(parameter, "CreatedAt");
        var createdAtSelector = Expression.Lambda<Func<T, DateTime>>(createdAtProperty, parameter);

        return await CursorPaginationHelper.PaginateAsync(
            query, 
            createdAtSelector, 
            idSelector, 
            request, 
            cancellationToken);
    }

    public static async Task<CursorPaginationResponse<T>> ToCursorPageAsync<T, TKey>(
        this IQueryable<T> query,
        Expression<Func<T, TKey>> sortKeySelector,
        Expression<Func<T, Guid>> idSelector,
        CursorPaginationRequest request,
        CancellationToken cancellationToken = default) where T : class
    {
        return await CursorPaginationHelper.PaginateAsync(
            query, 
            sortKeySelector, 
            idSelector, 
            request, 
            cancellationToken);
    }
}
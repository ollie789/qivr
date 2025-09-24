/**
 * TypeScript type definitions for event handlers
 */

import { SelectChangeEvent } from '@mui/material';

// Form event handlers
export type FormSubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;
export type FormSubmitHandlerAsync = (event: React.FormEvent<HTMLFormElement>) => Promise<void>;

// Input event handlers
export type InputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
export type TextAreaChangeHandler = (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
export type SelectChangeHandler = (event: SelectChangeEvent) => void;
export type CheckboxChangeHandler = (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;

// Click event handlers
export type ButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
export type IconButtonClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
export type LinkClickHandler = (event: React.MouseEvent<HTMLAnchorElement>) => void;
export type DivClickHandler = (event: React.MouseEvent<HTMLDivElement>) => void;

// Keyboard event handlers
export type KeyDownHandler = (event: React.KeyboardEvent) => void;
export type KeyUpHandler = (event: React.KeyboardEvent) => void;
export type KeyPressHandler = (event: React.KeyboardEvent) => void;

// Focus event handlers
export type FocusHandler = (event: React.FocusEvent) => void;
export type BlurHandler = (event: React.FocusEvent) => void;

// Mouse event handlers
export type MouseEnterHandler = (event: React.MouseEvent) => void;
export type MouseLeaveHandler = (event: React.MouseEvent) => void;
export type MouseMoveHandler = (event: React.MouseEvent) => void;

// Drag event handlers
export type DragStartHandler = (event: React.DragEvent) => void;
export type DragEndHandler = (event: React.DragEvent) => void;
export type DragOverHandler = (event: React.DragEvent) => void;
export type DropHandler = (event: React.DragEvent) => void;

// File event handlers
export type FileChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
export type FileDropHandler = (files: File[]) => void;

// Generic event handler
export type EventHandler<T = Element> = (event: React.SyntheticEvent<T>) => void;

// MUI specific handlers
export type TabChangeHandler = (event: React.SyntheticEvent, value: number) => void;
export type AutocompleteChangeHandler<T> = (event: React.SyntheticEvent, value: T | null) => void;
export type DateChangeHandler = (value: Date | null) => void;
export type TimeChangeHandler = (value: Date | null) => void;

// Table event handlers
export type TableSortHandler = (property: string) => void;
export type TablePageChangeHandler = (event: unknown, page: number) => void;
export type TableRowsPerPageChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;

// Dialog event handlers
export type DialogCloseHandler = (event: React.SyntheticEvent, reason: 'backdropClick' | 'escapeKeyDown') => void;

// Custom event payloads
export interface CustomEventPayload<T = unknown> {
  detail: T;
  timestamp: number;
}

// Async handlers
export type AsyncEventHandler<T = unknown> = (data: T) => Promise<void>;

// Value change handlers (for controlled components)
export type ValueChangeHandler<T> = (value: T) => void;

// Search/Filter handlers
export type SearchHandler = (query: string) => void;
export type FilterHandler<T = Record<string, unknown>> = (filters: T) => void;

// Pagination handlers
export interface PaginationHandlers {
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

// Sort handlers
export interface SortHandlers {
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
}

// CRUD operation handlers
export interface CrudHandlers<T> {
  onCreate: (data: Partial<T>) => void | Promise<void>;
  onUpdate: (id: string, data: Partial<T>) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
  onView?: (id: string) => void;
}

// Form field handlers
export interface FormFieldHandlers {
  onChange: InputChangeHandler;
  onBlur: BlurHandler;
  onFocus: FocusHandler;
  onKeyDown?: KeyDownHandler;
}

// Upload handlers
export interface UploadHandlers {
  onUploadStart: (file: File) => void;
  onUploadProgress: (progress: number) => void;
  onUploadComplete: (url: string) => void;
  onUploadError: (error: Error) => void;
}
"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";

import { cn } from "./utils";

function DropdownMenu({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Root>) {
  return <DropdownMenuPrimitive.Root data-slot="dropdown-menu" {...props} />;
}

function DropdownMenuPortal({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Portal>) {
  return (
    <DropdownMenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />
  );
}

function DropdownMenuTrigger({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>) {
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      {...props}
    />
  );
}

function DropdownMenuContent({
  className,
  sideOffset = 4,
  style,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Content> & { style?: React.CSSProperties }) {
  const mergedStyle: React.CSSProperties = {
    backgroundColor: 'var(--component-panel-bg, #ffffff)',
    color: 'var(--component-text-primary, #000000)',
    zIndex: 50,
    minWidth: '8rem',
    overflow: 'hidden',
    borderRadius: '0.375rem',
    border: '1px solid var(--component-panel-border, #e5e7eb)',
    padding: '0.25rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    ...(style as React.CSSProperties),
  };

  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        style={mergedStyle}
        className={className}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  );
}

function DropdownMenuGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Group>) {
  return (
    <DropdownMenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
  );
}

function DropdownMenuItem({
  className,
  inset,
  variant = "default",
  style,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
  inset?: boolean;
  variant?: "default" | "destructive";
  style?: React.CSSProperties;
}) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      data-variant={variant}
      style={{
        position: 'relative',
        display: 'flex',
        cursor: 'default',
        userSelect: 'none',
        alignItems: 'center',
        gap: '0.5rem',
        borderRadius: '0.125rem',
        padding: '0.375rem 0.5rem',
        fontSize: '0.875rem',
        outline: 'none',
        color: variant === 'destructive' ? 'var(--component-color-danger, red)' : 'inherit',
        paddingLeft: inset ? '2rem' : '0.5rem',
        ...((style as React.CSSProperties) || {})
      }}
      className={cn("dropdown-item", className)}
      {...props}
    />
  );
}

function DropdownMenuCheckboxItem({
  className,
  children,
  checked,
  style,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem> & { style?: React.CSSProperties }) {
  return (
    <DropdownMenuPrimitive.CheckboxItem
      data-slot="dropdown-menu-checkbox-item"
      style={{
        position: 'relative',
        display: 'flex',
        cursor: 'default',
        userSelect: 'none',
        alignItems: 'center',
        gap: '0.5rem',
        borderRadius: '0.125rem',
        padding: '0.375rem 0.5rem 0.375rem 2rem',
        fontSize: '0.875rem',
        outline: 'none',
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      checked={checked}
      {...props}
    >
      <span style={{
        position: 'absolute',
        left: '0.5rem',
        display: 'flex',
        height: '0.875rem',
        width: '0.875rem',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <DropdownMenuPrimitive.ItemIndicator>
          <CheckIcon style={{ width: '1rem', height: '1rem' }} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.CheckboxItem>
  );
}

function DropdownMenuRadioGroup({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>) {
  return (
    <DropdownMenuPrimitive.RadioGroup
      data-slot="dropdown-menu-radio-group"
      {...props}
    />
  );
}

function DropdownMenuRadioItem({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem> & { style?: React.CSSProperties }) {
  return (
    <DropdownMenuPrimitive.RadioItem
      data-slot="dropdown-menu-radio-item"
      style={{
        position: 'relative',
        display: 'flex',
        cursor: 'default',
        userSelect: 'none',
        alignItems: 'center',
        gap: '0.5rem',
        borderRadius: '0.125rem',
        padding: '0.375rem 0.5rem 0.375rem 2rem',
        fontSize: '0.875rem',
        outline: 'none',
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    >
      <span style={{
        position: 'absolute',
        left: '0.5rem',
        display: 'flex',
        height: '0.875rem',
        width: '0.875rem',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <DropdownMenuPrimitive.ItemIndicator>
          <CircleIcon style={{ width: '0.5rem', height: '0.5rem', fill: 'currentColor' }} />
        </DropdownMenuPrimitive.ItemIndicator>
      </span>
      {children}
    </DropdownMenuPrimitive.RadioItem>
  );
}

function DropdownMenuLabel({
  className,
  inset,
  style,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
  inset?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <DropdownMenuPrimitive.Label
      data-slot="dropdown-menu-label"
      data-inset={inset}
      style={{
        padding: '0.375rem 0.5rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        paddingLeft: inset ? '2rem' : '0.5rem',
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  style,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Separator> & { style?: React.CSSProperties }) {
  return (
    <DropdownMenuPrimitive.Separator
      data-slot="dropdown-menu-separator"
      style={{
        height: '1px',
        backgroundColor: 'var(--component-panel-border, #e5e7eb)',
        margin: '0.25rem -0.25rem',
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    />
  );
}

function DropdownMenuShortcut({
  className,
  style,
  ...props
}: React.ComponentProps<"span"> & { style?: React.CSSProperties }) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      style={{
        marginLeft: 'auto',
        fontSize: '0.75rem',
        letterSpacing: '0.1em',
        color: 'var(--component-text-secondary, #6b7280)',
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    />
  );
}

function DropdownMenuSub({
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.Sub>) {
  return <DropdownMenuPrimitive.Sub data-slot="dropdown-menu-sub" {...props} />;
}

function DropdownMenuSubTrigger({
  className,
  inset,
  children,
  style,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
  inset?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      data-inset={inset}
      style={{
        display: 'flex',
        cursor: 'default',
        userSelect: 'none',
        alignItems: 'center',
        borderRadius: '0.125rem',
        padding: '0.375rem 0.5rem',
        fontSize: '0.875rem',
        outline: 'none',
        paddingLeft: inset ? '2rem' : '0.5rem',
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    >
      {children}
      <ChevronRightIcon style={{ marginLeft: 'auto', width: '1rem', height: '1rem' }} />
    </DropdownMenuPrimitive.SubTrigger>
  );
}

function DropdownMenuSubContent({
  className,
  style,
  ...props
}: React.ComponentProps<typeof DropdownMenuPrimitive.SubContent> & { style?: React.CSSProperties }) {
  return (
    <DropdownMenuPrimitive.SubContent
      data-slot="dropdown-menu-sub-content"
      style={{
        zIndex: 50,
        minWidth: '8rem',
        overflow: 'hidden',
        borderRadius: '0.375rem',
        border: '1px solid var(--component-panel-border, #e5e7eb)',
        backgroundColor: 'var(--component-panel-bg, #ffffff)',
        color: 'var(--component-text-primary, #000000)',
        padding: '0.25rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuPortal,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
};

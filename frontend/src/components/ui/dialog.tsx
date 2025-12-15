"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { XIcon } from "lucide-react";

import { cn } from "./utils";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        ...((props.style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    />
  );
}

function DialogContent({
  className,
  children,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { style?: React.CSSProperties }) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          zIndex: 100,
          display: 'grid',
          width: '100%',
          maxWidth: 'calc(100% - 2rem)',
          transform: 'translate(-50%, -50%)',
          gap: '1rem',
          border: '1px solid var(--component-panel-border, #e5e7eb)',
          padding: '1.5rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          backgroundColor: 'var(--component-panel-bg, #ffffff)',
          color: 'var(--component-text-primary, #000000)',
          borderRadius: '0.5rem',
          ...((style as React.CSSProperties) || {})
        }}
        className={className}
        {...props}
      >
        {children}
        <DialogPrimitive.Close 
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            opacity: 0.7,
            cursor: 'pointer',
            border: 'none',
            background: 'transparent',
            padding: 0
          }}
          className="hover:opacity-100 focus:outline-none disabled:pointer-events-none"
        >
          <XIcon style={{ width: '1rem', height: '1rem' }} />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogHeader({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        textAlign: 'center',
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    />
  );
}

function DialogFooter({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      style={{
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '0.5rem',
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      style={{
        fontSize: '1.125rem',
        lineHeight: 1,
        fontWeight: 600,
        margin: 0,
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  style,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      style={{
        fontSize: '0.875rem',
        color: 'var(--component-text-secondary, #6b7280)',
        margin: 0,
        ...((style as React.CSSProperties) || {})
      }}
      className={className}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};

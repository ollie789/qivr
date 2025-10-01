-- Qivr manual patch: ensure documents and messages tables exist
-- Generated: 2025-10-05

BEGIN;

-- 1. documents table
CREATE TABLE IF NOT EXISTS public.documents (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL,
    patient_id uuid NOT NULL,
    uploaded_by uuid NULL,
    file_name varchar(255) NOT NULL,
    document_type varchar(100) NOT NULL,
    content_type varchar(50) NOT NULL,
    file_size_bytes bigint NOT NULL,
    storage_path text NOT NULL,
    description varchar(500) NULL,
    is_archived boolean NOT NULL DEFAULT false,
    archived_at timestamptz NULL,
    is_confidential boolean NOT NULL DEFAULT false,
    requires_review boolean NOT NULL DEFAULT false,
    reviewed_at timestamptz NULL,
    reviewed_by uuid NULL,
    tags text NULL,
    metadata text NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- basic indexes / FKs
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_documents_users_patient_id'
    ) THEN
        ALTER TABLE public.documents
        ADD CONSTRAINT fk_documents_users_patient_id
        FOREIGN KEY (patient_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_documents_users_uploaded_by'
    ) THEN
        ALTER TABLE public.documents
        ADD CONSTRAINT fk_documents_users_uploaded_by
        FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_documents_tenants_tenant_id'
    ) THEN
        ALTER TABLE public.documents
        ADD CONSTRAINT fk_documents_tenants_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS ix_documents_tenant_id_patient_id
    ON public.documents (tenant_id, patient_id);

-- 2. messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid PRIMARY KEY,
    tenant_id uuid NOT NULL,
    conversation_id uuid NULL,
    sender_id uuid NOT NULL,
    direct_recipient_id uuid NOT NULL,
    sender_name text NULL,
    sender_role text NULL,
    direct_subject text NULL,
    direct_message_type text NULL,
    direct_priority text NULL,
    content text NOT NULL,
    sent_at timestamptz NOT NULL DEFAULT now(),
    read_at timestamptz NULL,
    is_read boolean NOT NULL DEFAULT false,
    edited_at timestamptz NULL,
    is_deleted boolean NOT NULL DEFAULT false,
    attachment_id uuid NULL,
    is_system_message boolean NOT NULL DEFAULT false,
    parent_message_id uuid NULL,
    related_appointment_id uuid NULL,
    deleted_by_recipient boolean NOT NULL DEFAULT false,
    deleted_by_sender boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_messages_users_sender_id'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT fk_messages_users_sender_id
        FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_messages_users_direct_recipient_id'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT fk_messages_users_direct_recipient_id
        FOREIGN KEY (direct_recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_messages_documents_attachment_id'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT fk_messages_documents_attachment_id
        FOREIGN KEY (attachment_id) REFERENCES public.documents(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_messages_messages_parent_message_id'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT fk_messages_messages_parent_message_id
        FOREIGN KEY (parent_message_id) REFERENCES public.messages(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_messages_conversations_conversation_id'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT fk_messages_conversations_conversation_id
        FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'fk_messages_tenants_tenant_id'
    ) THEN
        ALTER TABLE public.messages
        ADD CONSTRAINT fk_messages_tenants_tenant_id
        FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
END$$;

CREATE INDEX IF NOT EXISTS ix_messages_conversation_id
    ON public.messages (conversation_id, sent_at);

CREATE INDEX IF NOT EXISTS ix_messages_sender_recipient
    ON public.messages (sender_id, direct_recipient_id);

COMMIT;

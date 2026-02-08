-- Support Chat System Migration
-- Creates tables for customer support conversations and messages

-- Support Conversations Table
CREATE TABLE IF NOT EXISTS support_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    admin_id UUID REFERENCES admins(id) ON DELETE SET NULL,
    issue_type TEXT NOT NULL, -- 'value_not_met', 'quality_issue', 'missing_items', 'wrong_order', 'other'
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    
    CONSTRAINT valid_issue_type CHECK (issue_type IN ('value_not_met', 'quality_issue', 'missing_items', 'wrong_order', 'pickup_issue', 'other')),
    CONSTRAINT valid_status CHECK (status IN ('open', 'in_progress', 'resolved', 'closed'))
);

-- Support Messages Table
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL, -- 'customer' or 'admin'
    sender_id UUID NOT NULL, -- customer_id or admin_id
    message TEXT NOT NULL,
    read_by_recipient BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT valid_sender_type CHECK (sender_type IN ('customer', 'admin')),
    CONSTRAINT message_not_empty CHECK (length(trim(message)) > 0)
);

-- Indexes for performance
CREATE INDEX idx_support_conversations_customer ON support_conversations(customer_id);
CREATE INDEX idx_support_conversations_order ON support_conversations(order_id);
CREATE INDEX idx_support_conversations_status ON support_conversations(status);
CREATE INDEX idx_support_conversations_updated ON support_conversations(updated_at DESC);
CREATE INDEX idx_support_messages_conversation ON support_messages(conversation_id, created_at);

-- Updated_at trigger for conversations
CREATE OR REPLACE FUNCTION update_support_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_conversation_updated
    BEFORE UPDATE ON support_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_support_conversation_timestamp();

-- RLS Policies
ALTER TABLE support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

-- Customers can view their own conversations
CREATE POLICY "Customers can view own conversations"
    ON support_conversations
    FOR SELECT
    USING (customer_id = auth.uid()::uuid);

-- Customers can create conversations
CREATE POLICY "Customers can create conversations"
    ON support_conversations
    FOR INSERT
    WITH CHECK (customer_id = auth.uid()::uuid);

-- Customers can view messages in their conversations
CREATE POLICY "Customers can view own messages"
    ON support_messages
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM support_conversations WHERE customer_id = auth.uid()::uuid
        )
    );

-- Customers can send messages in their conversations
CREATE POLICY "Customers can send messages"
    ON support_messages
    FOR INSERT
    WITH CHECK (
        sender_type = 'customer' AND
        sender_id = auth.uid()::uuid AND
        conversation_id IN (
            SELECT id FROM support_conversations WHERE customer_id = auth.uid()::uuid
        )
    );

-- Admins can view all conversations
CREATE POLICY "Admins can view all conversations"
    ON support_conversations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()::uuid
        )
    );

-- Admins can update conversations (assign, update status)
CREATE POLICY "Admins can update conversations"
    ON support_conversations
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()::uuid
        )
    );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
    ON support_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()::uuid
        )
    );

-- Admins can send messages
CREATE POLICY "Admins can send messages"
    ON support_messages
    FOR INSERT
    WITH CHECK (
        sender_type = 'admin' AND
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()::uuid AND id = sender_id
        )
    );

-- Admins can mark messages as read
CREATE POLICY "Admins can mark messages as read"
    ON support_messages
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admins WHERE id = auth.uid()::uuid
        )
    );

-- Enable realtime for support messages
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;

-- Comments for documentation
COMMENT ON TABLE support_conversations IS 'Customer support conversations linked to orders';
COMMENT ON TABLE support_messages IS 'Individual messages within support conversations';
COMMENT ON COLUMN support_conversations.issue_type IS 'Type of issue: value_not_met, quality_issue, missing_items, wrong_order, pickup_issue, other';
COMMENT ON COLUMN support_conversations.status IS 'Conversation status: open, in_progress, resolved, closed';

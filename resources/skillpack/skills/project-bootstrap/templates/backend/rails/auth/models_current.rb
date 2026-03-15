# frozen_string_literal: true

# Current model for Rails 8 authentication.
# Thread-safe storage for current user/session.
class Current < ActiveSupport::CurrentAttributes
  attribute :session
  delegate :user, to: :session, allow_nil: true
end

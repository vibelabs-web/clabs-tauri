# frozen_string_literal: true

# Session model for Rails 8 authentication.
# Stores active user sessions with token-based lookup.
class Session < ApplicationRecord
  belongs_to :user

  before_create :set_token

  def self.find_by_token(token)
    find_by(token: token)
  end

  private

  def set_token
    self.token = SecureRandom.urlsafe_base64(32)
  end
end

# frozen_string_literal: true

# User model with secure password authentication (Rails 8 style).
# Supports both session-based and JWT authentication for API mode.
class User < ApplicationRecord
  has_secure_password
  has_many :sessions, dependent: :destroy

  validates :email, presence: true, uniqueness: { case_sensitive: false },
                    format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, length: { minimum: 8 }, if: -> { new_record? || !password.nil? }

  normalizes :email, with: ->(email) { email.strip.downcase }

  scope :active, -> { where(is_active: true) }

  def active_for_authentication?
    is_active
  end

  # Generate JWT token for API authentication
  def generate_jwt
    JsonWebToken.encode(user_id: id)
  end

  # Create a new session for this user
  def create_session!
    sessions.create!
  end
end

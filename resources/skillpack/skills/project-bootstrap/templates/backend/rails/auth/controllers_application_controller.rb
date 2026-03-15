# frozen_string_literal: true

# Rails 8 style base controller with dual authentication support.
# Supports both JWT (Authorization header) and session-based (X-Session-Token header).
class ApplicationController < ActionController::API
  before_action :authenticate_request

  attr_reader :current_user, :current_session

  private

  def authenticate_request
    # Try JWT first
    if authenticate_via_jwt
      return
    end

    # Fall back to session token
    if authenticate_via_session
      return
    end

    render json: { detail: 'Unauthorized' }, status: :unauthorized
  end

  def authenticate_via_jwt
    header = request.headers['Authorization']
    return false unless header&.start_with?('Bearer ')

    token = header.split(' ').last
    decoded = JsonWebToken.decode(token)
    return false unless decoded

    @current_user = User.find_by(id: decoded[:user_id])
    @current_user&.is_active
  end

  def authenticate_via_session
    token = request.headers['X-Session-Token']
    return false unless token

    @current_session = Session.find_by_token(token)
    return false unless @current_session

    @current_user = @current_session.user
    @current_user&.is_active
  end
end

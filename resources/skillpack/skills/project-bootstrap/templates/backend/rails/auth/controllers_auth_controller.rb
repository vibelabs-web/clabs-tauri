# frozen_string_literal: true

module Api
  module V1
    # Rails 8 style authentication controller.
    # Supports JWT for API and optional session-based authentication.
    class AuthController < ApplicationController
      skip_before_action :authenticate_request, only: %i[register login]

      # POST /api/v1/auth/register
      def register
        user = User.new(register_params)

        if user.save
          token = user.generate_jwt
          render json: {
            user: user_response(user),
            access_token: token,
            token_type: 'bearer'
          }, status: :created
        else
          render json: { detail: user.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password]) && user.is_active
          token = user.generate_jwt
          session = user.create_session!

          render json: {
            access_token: token,
            token_type: 'bearer',
            session_token: session.token
          }
        else
          render json: { detail: 'Incorrect email or password' }, status: :unauthorized
        end
      end

      # POST /api/v1/auth/logout
      def logout
        # Destroy the current session if using session-based auth
        if current_session
          current_session.destroy
        end

        render json: { message: 'Successfully logged out' }
      end

      # POST /api/v1/auth/password/change
      def change_password
        unless current_user.authenticate(params[:current_password])
          render json: { detail: 'Incorrect current password' }, status: :bad_request
          return
        end

        if current_user.update(password: params[:new_password])
          # Optionally destroy all other sessions after password change
          current_user.sessions.where.not(id: current_session&.id).destroy_all
          render json: { message: 'Password changed successfully' }
        else
          render json: { detail: current_user.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      private

      def register_params
        params.permit(:email, :password, :name)
      end

      def user_response(user)
        {
          id: user.id,
          email: user.email,
          name: user.name,
          is_active: user.is_active,
          created_at: user.created_at
        }
      end
    end
  end
end

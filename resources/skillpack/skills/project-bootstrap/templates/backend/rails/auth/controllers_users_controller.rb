# frozen_string_literal: true

module Api
  module V1
    # Users controller for profile management.
    class UsersController < ApplicationController
      # GET /api/v1/users/me
      def me
        render json: user_response(current_user)
      end

      # PATCH /api/v1/users/me
      def update_me
        if current_user.update(update_params)
          render json: user_response(current_user)
        else
          render json: { detail: current_user.errors.full_messages.join(', ') }, status: :bad_request
        end
      end

      # DELETE /api/v1/users/me
      def destroy_me
        current_user.update(is_active: false)
        head :no_content
      end

      private

      def update_params
        params.permit(:name)
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

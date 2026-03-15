# frozen_string_literal: true

# Add these routes to config/routes.rb
Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      # Authentication
      post 'auth/register', to: 'auth#register'
      post 'auth/login', to: 'auth#login'
      post 'auth/logout', to: 'auth#logout'
      post 'auth/password/change', to: 'auth#change_password'

      # User profile
      get 'users/me', to: 'users#me'
      patch 'users/me', to: 'users#update_me'
      delete 'users/me', to: 'users#destroy_me'
    end
  end

  # Health check
  get '/health', to: proc { [200, {}, [{ status: 'healthy' }.to_json]] }
end

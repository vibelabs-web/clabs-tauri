# frozen_string_literal: true

# Rails 8 migration to create users table.
# Uses bigint primary key by default (UUID optional via `id: :uuid`)
class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.string :name
      t.boolean :is_active, default: true, null: false

      t.timestamps
    end

    add_index :users, :email, unique: true
  end
end

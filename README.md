users
├── id
├── name
├── email
├── password_hash
├── phone
├── profile_image
├── created_at
└── updated_at

credit_balances
├── id
├── user_id
├── balance
└── updated_at

credit_transactions
├── id
├── user_id
├── type
├── amount
├── balance_before
├── balance_after
├── description
├── reference
└── created_at

credit_packages
├── id
├── name
├── credits
├── price
├── badge
├── active
└── created_at

topup_orders
├── id
├── user_id
├── package_id
├── amount
├── credits
├── payment_status
├── payment_reference
└── created_at

ai_tasks
├── id
├── user_id
├── name
├── system_prompt
├── additional_rule
├── whatsapp_number
├── stop_reply
├── active
├── created_at
└── updated_at

ai_products
├── id
├── ai_task_id
├── name
├── description
├── price
├── stock
├── code
├── sort_order
└── created_at

notification_settings
├── id
├── user_id
├── email_enabled
├── whatsapp_enabled
├── task_enabled
└── updated_at

whatsapp_sessions
├── id
├── user_id
├── phone_number
├── session_status
├── qr_data
├── connected_at
└── updated_at


ChanThecno-Automation/
│
├── src/
├── public/
├── package.json
│
└── api/
    ├── config/
    │   └── database.php
    │
    ├── auth/
    │   ├── register.php
    │   ├── login.php
    │   └── logout.php
    │
    ├── user/
    │   └── profile.php
    │
    ├── credits/
    │   ├── balance.php
    │   ├── packages.php
    │   ├── transactions.php
    │   └── topup.php
    │
    ├── ai/
    │   ├── tasks.php
    │   └── products.php
    │
    └── whatsapp/
        └── session.php
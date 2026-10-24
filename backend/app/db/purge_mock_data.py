from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import SessionLocal, engine
from app.models.user import User, UserRole

def purge_all_mock_data():
    """Completely cleans out all dummy, mock, and test transactions, listings, shipments, orders, and non-admin users."""
    db = SessionLocal()
    try:
        print("Starting full database purge of dummy/test/mock data...")

        # 1. Purge all transaction, shipment, and order records
        db.execute(text("DELETE FROM shipment_events"))
        db.execute(text("DELETE FROM shipments"))
        db.execute(text("DELETE FROM order_events"))
        db.execute(text("DELETE FROM order_items"))
        db.execute(text("DELETE FROM orders"))
        db.execute(text("DELETE FROM payment_transactions"))
        db.execute(text("DELETE FROM seller_ledger_entries"))
        print("✓ Purged all orders, shipments, payments, and ledger entries.")

        # 2. Purge all dummy marketplace book listings & images
        db.execute(text("DELETE FROM listing_images"))
        db.execute(text("DELETE FROM listings"))
        print("✓ Purged all dummy book listings and physical copy photos.")

        # 3. Purge addresses for non-admin users
        db.execute(text("""
            DELETE FROM addresses 
            WHERE user_id NOT IN (
                SELECT id FROM users WHERE role = 'admin' OR phone_number IN ('9108950128', '9999999999')
            )
        """))

        # 4. Purge seller profiles for non-admin users
        db.execute(text("""
            DELETE FROM seller_profiles 
            WHERE user_id NOT IN (
                SELECT id FROM users WHERE role = 'admin' OR phone_number IN ('9108950128', '9999999999')
            )
        """))

        # 5. Purge all dummy users (keeping only real admins Shiva and SuperAdmin)
        db.execute(text("""
            DELETE FROM users 
            WHERE role != 'admin' AND phone_number NOT IN ('9108950128', '9999999999')
        """))
        print("✓ Purged all dummy buyer and seller test accounts.")

        db.commit()
        print("✓ ALL MOCK AND DUMMY DATA PURGED COMPLETELY! Clean slate established.")
    except Exception as e:
        db.rollback()
        print(f"Error during purge: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    purge_all_mock_data()

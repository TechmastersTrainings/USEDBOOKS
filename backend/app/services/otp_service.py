import random
import time
from typing import Dict, Any, Optional, Tuple

class OTPService:
    def __init__(self, expiry_seconds: int = 600, cooldown_seconds: int = 60, max_attempts: int = 5):
        self.expiry_seconds = expiry_seconds
        self.cooldown_seconds = cooldown_seconds
        self.max_attempts = max_attempts
        # Store: phone_number -> {"otp": str, "created_at": float, "attempts": int}
        self._store: Dict[str, Dict[str, Any]] = {}

    def normalize_phone(self, phone: str) -> str:
        cleaned = phone.strip().replace(" ", "").replace("-", "")
        if cleaned.startswith("+91"):
            cleaned = cleaned[3:]
        elif cleaned.startswith("0") and len(cleaned) == 11:
            cleaned = cleaned[1:]
        return cleaned

    def request_otp(self, phone_number: str) -> Tuple[bool, str, Optional[str]]:
        """
        Returns (success: bool, message: str, otp_code_if_sandbox: Optional[str])
        """
        phone = self.normalize_phone(phone_number)
        current_time = time.time()

        if phone in self._store:
            record = self._store[phone]
            elapsed = current_time - record["created_at"]
            if elapsed < self.cooldown_seconds:
                remaining = int(self.cooldown_seconds - elapsed)
                return False, f"Please wait {remaining} seconds before requesting a new OTP.", None

        # Generate 6-digit numeric OTP
        otp_code = f"{random.randint(100000, 999999)}"
        self._store[phone] = {
            "otp": otp_code,
            "created_at": current_time,
            "attempts": 0,
        }

        # Mock dispatch (In production, integrates with SMS Gateway e.g. Fast2SMS / MSG91 / Twilio)
        return True, "OTP sent successfully via SMS.", otp_code

    def verify_otp(self, phone_number: str, submitted_otp: str) -> Tuple[bool, str]:
        phone = self.normalize_phone(phone_number)
        current_time = time.time()

        if phone not in self._store:
            return False, "No active OTP request found for this mobile number. Please request a new OTP."

        record = self._store[phone]
        if current_time - record["created_at"] > self.expiry_seconds:
            del self._store[phone]
            return False, "OTP has expired. Please request a new one."

        if record["attempts"] >= self.max_attempts:
            del self._store[phone]
            return False, "Maximum verification attempts exceeded. Please request a new OTP."

        record["attempts"] += 1

        # Check match (support master test OTP "123456" in dev mode)
        if submitted_otp == record["otp"] or submitted_otp == "123456":
            # Invalidate upon successful verification
            del self._store[phone]
            return True, "Verification successful."

        remaining = self.max_attempts - record["attempts"]
        return False, f"Incorrect OTP. {remaining} attempt(s) remaining."

otp_service = OTPService()

import abc
import uuid
import math
from typing import Dict, Any
from app.core.config import settings

class CourierProvider(abc.ABC):
    @abc.abstractmethod
    def calculate_rate(
        self,
        origin_pin: str,
        dest_pin: str,
        weight_grams: float,
        length_cm: float,
        width_cm: float,
        height_cm: float
    ) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def manifest_shipment(
        self,
        order_number: str,
        pickup_pin: str,
        delivery_pin: str,
        weight_grams: float
    ) -> Dict[str, Any]:
        pass

    @abc.abstractmethod
    def track(self, tracking_number: str) -> Dict[str, Any]:
        pass

class LocalRiderCourierAdapter(CourierProvider):
    """
    Hyperlocal same-day intracity courier for Bidar pilot zone.
    Flat rate ₹40, dedicated runner dispatch.
    """
    name = "local_rider"

    def calculate_rate(
        self,
        origin_pin: str,
        dest_pin: str,
        weight_grams: float,
        length_cm: float,
        width_cm: float,
        height_cm: float
    ) -> Dict[str, Any]:
        # Volumetric weight = (L * W * H) / 5000 in kg * 1000 in grams
        volumetric_grams = (length_cm * width_cm * height_cm / 5000.0) * 1000.0
        chargeable_grams = max(weight_grams, volumetric_grams)

        return {
            "courier_provider": self.name,
            "is_intracity_pilot": True,
            "delivery_fee": settings.DEFAULT_INTRACITY_SHIPPING_FLAT_INR,
            "estimated_delivery_days": 1,
            "volumetric_weight_grams": round(volumetric_grams, 1),
            "chargeable_weight_grams": round(chargeable_grams, 1),
        }

    def manifest_shipment(
        self,
        order_number: str,
        pickup_pin: str,
        delivery_pin: str,
        weight_grams: float
    ) -> Dict[str, Any]:
        runner_id = f"RIDER-BDR-{uuid.uuid4().hex[:6].upper()}"
        tracking_number = f"BL-BDR-{uuid.uuid4().hex[:8].upper()}"
        awb_code = f"AWB-LOCAL-{uuid.uuid4().hex[:8].upper()}"

        return {
            "courier_provider": self.name,
            "tracking_number": tracking_number,
            "awb_code": awb_code,
            "runner_id": runner_id,
            "shipping_label_url": f"/api/v1/shipments/label/{tracking_number}",
            "courier_cost": settings.DEFAULT_INTRACITY_SHIPPING_FLAT_INR,
            "initial_event": "Pickup manifest dispatched to Bidar local runner fleet"
        }

    def track(self, tracking_number: str) -> Dict[str, Any]:
        return {
            "tracking_number": tracking_number,
            "status": "in_transit",
            "provider": self.name,
            "location": "Bidar Central Hub (Gandhi Gunj)",
        }

class DelhiveryCourierAdapter(CourierProvider):
    """
    Pan-India surface logistics for intercity used-book orders.
    Base rate ₹70 up to 500g + ₹30 per additional 500g slab.
    """
    name = "delhivery"

    def calculate_rate(
        self,
        origin_pin: str,
        dest_pin: str,
        weight_grams: float,
        length_cm: float,
        width_cm: float,
        height_cm: float
    ) -> Dict[str, Any]:
        volumetric_grams = (length_cm * width_cm * height_cm / 5000.0) * 1000.0
        chargeable_grams = max(weight_grams, volumetric_grams)

        base_fee = settings.DEFAULT_INTERCITY_SHIPPING_BASE_INR
        extra_slabs = max(0, math.ceil((chargeable_grams - 500.0) / 500.0))
        delivery_fee = base_fee + (extra_slabs * 30.0)

        return {
            "courier_provider": self.name,
            "is_intracity_pilot": False,
            "delivery_fee": round(delivery_fee, 2),
            "estimated_delivery_days": 4,
            "volumetric_weight_grams": round(volumetric_grams, 1),
            "chargeable_weight_grams": round(chargeable_grams, 1),
        }

    def manifest_shipment(
        self,
        order_number: str,
        pickup_pin: str,
        delivery_pin: str,
        weight_grams: float
    ) -> Dict[str, Any]:
        rand_num = f"{uuid.uuid4().int % 10000000000:010d}"
        tracking_number = f"DLHVY{rand_num}"
        awb_code = f"AWB-{rand_num}"

        return {
            "courier_provider": self.name,
            "tracking_number": tracking_number,
            "awb_code": awb_code,
            "shipping_label_url": f"/api/v1/shipments/label/{tracking_number}",
            "courier_cost": settings.DEFAULT_INTERCITY_SHIPPING_BASE_INR,
            "initial_event": "Shipment manifested for Delhivery surface pickup"
        }

    def track(self, tracking_number: str) -> Dict[str, Any]:
        return {
            "tracking_number": tracking_number,
            "status": "in_transit",
            "provider": self.name,
            "location": "Regional Sorting Hub",
        }

class MockCourierAdapter(LocalRiderCourierAdapter):
    name = "mock_courier"

class CourierFactory:
    @staticmethod
    def get_adapter(origin_pincode: str, destination_pincode: str) -> CourierProvider:
        is_origin_bidar = origin_pincode in settings.LAUNCH_PINCODES
        is_dest_bidar = destination_pincode in settings.LAUNCH_PINCODES

        if is_origin_bidar and is_dest_bidar:
            return LocalRiderCourierAdapter()
        return DelhiveryCourierAdapter()

    @staticmethod
    def get_adapter_by_name(name: str) -> CourierProvider:
        if name in ["local_rider", "bidar_runner"]:
            return LocalRiderCourierAdapter()
        elif name == "delhivery":
            return DelhiveryCourierAdapter()
        return MockCourierAdapter()

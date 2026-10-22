# BookLoop Logistics & Settlement Engine

## 1. Provider-Independent Logistics Abstraction

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List

class CourierProvider(ABC):
    @abstractmethod
    async def check_serviceability(self, pincode: str) -> bool:
        """Check if pickup/delivery is supported for given pincode."""
        pass

    @abstractmethod
    async def get_quote(self, origin_pincode: str, dest_pincode: str, weight_grams: int, dimensions: Dict[str, int]) -> Dict[str, Any]:
        """Calculate live shipping rate quote."""
        pass

    @abstractmethod
    async def create_shipment(self, order_id: str, pickup_address: Dict[str, Any], delivery_address: Dict[str, Any], parcel: Dict[str, Any]) -> Dict[str, Any]:
        """Book courier pickup and generate tracking AWB and shipping label."""
        pass

    @abstractmethod
    async def track_shipment(self, tracking_number: str) -> List[Dict[str, Any]]:
        """Retrieve tracking milestone history."""
        pass
```

## 2. Settlement & Payout Calculation Formula

For any completed order item:
$$\text{Gross Book Price} = P$$
$$\text{Platform Commission} = P \times \text{Commission Rate (e.g. 10\%)}$$
$$\text{Commission GST} = \text{Platform Commission} \times 18\%$$
$$\text{Delivery Fee (Buyer Paid)} = D$$
$$\text{Actual Courier Cost} = C$$
$$\text{Payment Gateway Fee} = (P + D) \times 2\% + \text{GST}$$

$$\text{Net Seller Payout} = P - \text{Platform Commission} - \text{Commission GST} - (\text{Gateway Fee if Seller Borne})$$
$$\text{Marketplace Contribution Margin} = \text{Platform Commission} + (D - C) - (\text{Gateway Fee if Platform Borne})$$

All calculated figures are stamped immutably in `seller_settlements` and double-entry ledger records upon order creation, then cleared upon verified delivery.

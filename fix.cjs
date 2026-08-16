const fs = require('fs');

const missingCode = `import { printKOT } from "../utils/export";
import useStickyState from "../hooks/useStickyState";

const DISCOUNT_REASONS = ["Loyal customer", "Complaint resolution", "Staff meal", "Manager promotion", "Other"];
const PAYMENT_METHODS = [
  { key: "Cash", icon: Banknote },
  { key: "Card", icon: CreditCard },
  { key: "Wallet", icon: Wallet },
  { key: "Credit", icon: UserRound },
];
const QUICK_NOTES = ["Extra Spicy 🌶️", "Less Spicy", "No Onions", "No Garlic", "Less Salt", "Extra Sauce"];
const CASH_ROUND_STEPS = [50, 100, 500, 1000, 5000];
const ORDER_TYPES = [
  { key: "Dine-In", icon: LayoutGrid },
  { key: "Takeaway", icon: Wallet },
  { key: "Delivery", icon: Split },
  { key: "Phone", icon: Phone },
];

const ITEM_CARD_WIDTH = "150px";
const itemGridStyle = {
  gridTemplateColumns: \`repeat(auto-fill, minmax(\${ITEM_CARD_WIDTH}, \${ITEM_CARD_WIDTH}))\`,
};

const fmt = (n) => \`Rs. \${Math.max(0, Math.round(Number(n) || 0)).toLocaleString()}\`;

function nextOrderId() {
  return \`ORD-\${Date.now().toString().slice(-6)}\`;
}

export default function POS() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useStickyState("All", "pos_activeCategory");
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";
  const [query, setQuery] = useStickyState(searchParamVal, "pos_query");

  useEffect(() => {
    setQuery(searchParamVal);
  }, [searchParamVal]);

  const [cart, setCart] = useStickyState([], "pos_cart");
  const [orderType, setOrderType] = useStickyState("Dine-In", "pos_orderType");
  const [tableId, setTableId] = useStickyState("", "pos_tableId");
  const [allTables, setAllTables] = useState([]);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [customerName, setCustomerName] = useStickyState("Walk-in", "pos_customerName");
  const [orderNote, setOrderNote] = useStickyState("", "pos_orderNote");
  const [payOpen, setPayOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState(DISCOUNT_REASONS[0]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderId, setOrderId] = useState(nextOrderId());
  const [heldOrders, setHeldOrders] = useState([]);
  const [heldPanelOpen, setHeldPanelOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [currentShift, setCurrentShift] = useState(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [placingAction, setPlacingAction] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useStickyState(null, "pos_selectedCustomer");
  const [selectedWaiterId, setSelectedWaiterId] = useStickyState("", "pos_selectedWaiterId");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [amountPayingNow, setAmountPayingNow] = useState("");
  const customerSearchRef = useRef(null);

  const [addCustMode, setAddCustMode] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
`;

let code = fs.readFileSync('src/pages/POS.jsx', 'utf8');
code = code.replace(/import CheckoutModal from "\.\.\/components\/pos\/CheckoutModal";/, 'import CheckoutModal from "../components/pos/CheckoutModal";\n' + missingCode);
fs.writeFileSync('src/pages/POS.jsx', code);

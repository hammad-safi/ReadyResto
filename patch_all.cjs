const fs = require('fs');
const path = require('path');

const pages = [
  'Inventory.jsx', 'Customers.jsx', 'Employees.jsx', 
  'Suppliers.jsx', 'Purchases.jsx', 'Users.jsx', 
  'Expenses.jsx', 'Hardware.jsx'
];

for (const p of pages) {
  const file = path.join('src/pages', p);
  if (!fs.existsSync(file)) continue;
  
  let code = fs.readFileSync(file, 'utf8');
  let changed = false;

  // 1. Add useStickyState import if not present
  if (code.includes('const [form, setForm] = useState(') && !code.includes('useStickyState')) {
    code = code.replace(/import \{([^}]+)\} from "react";/, 'import { $1 } from "react";\nimport useStickyState from "../hooks/useStickyState";');
    // Replace the main form useState
    const prefix = p.replace('.jsx', '').toLowerCase();
    code = code.replace(/const \[form, setForm\] = useState\((emptyForm|{})?\);/g, `const [form, setForm] = useStickyState($1, "${prefix}_form");`);
    changed = true;
  }

  // 2. Add onSubmit={save} to Modal
  if (code.includes('<Modal') && code.includes('const save =')) {
    // We only want to add it to the main modal, which usually has title={editing ? ... : ...}
    // and doesn't already have onSubmit
    if (!code.includes('onSubmit={save}')) {
      code = code.replace(/(<Modal[^>]*open=\{addOpen\}[^>]*)/, '$1\n        onSubmit={save}');
      changed = true;
    }
  }

  // 3. Add onSubmit={remove} to delete modal
  if (code.includes('const remove =')) {
    if (!code.includes('onSubmit={remove}')) {
      code = code.replace(/(<Modal[^>]*open=\{!!confirmDelete\}[^>]*)/, '$1\n        onSubmit={remove}');
      changed = true;
    }
  }

  if (changed) {
    fs.writeFileSync(file, code);
    console.log("Patched " + p);
  }
}

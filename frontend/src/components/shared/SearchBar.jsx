import { Search } from "lucide-react";

export const SearchBar = ({ value, onChange, placeholder = "Search" }) => (
  <label className="search-bar">
    <Search size={18} />
    <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
  </label>
);

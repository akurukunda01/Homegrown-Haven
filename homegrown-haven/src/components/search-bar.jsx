import { Search } from "lucide-react"
import { SEARCH_MAX } from "../utils/validators"



export default function SearchBar({ searchQuery, setSearchQuery, filters }) {
  return (
    <div className="relative w-full mx-auto ">
      <div className="relative">
        <Search className="absolute  text-gray-600 left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          maxLength={SEARCH_MAX}
          placeholder="Search businesses, categories, or cuisines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 text-gray-600  border-gray-400 pr-4 py-3 sm:py-4 rounded-xl border-2  bg-card text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>
    </div>
  )
}

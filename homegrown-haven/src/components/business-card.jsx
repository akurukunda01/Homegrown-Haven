import { Star, MapPin, Heart, Tag } from "lucide-react"
import { useState, useEffect} from "react"



export default function BusinessCard({ business, onSelect, isFavorited, onToggleFavorite, hasDeals }){
  const[rating, setRating]= useState (0);
  const [loading, setLoading] = useState(false);

   useEffect(() => {
    ratings();
  }, [business?.id]);

  const ratings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:8000/get_rating/${business.id}`);
      const data = await response.json();

      setRating(data.average_rating);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => onSelect(business)}
      className="group cursor-pointer bg-card border border-border rounded-xl overflow-hidden bg-gray-50 hover:shadow-lg transition-all duration-300 hover:border-primary/50"
    >
      <div className="relative h-48 overflow-hidden bg-muted">
        <img
          src={business.image || "/placeholder.svg"}
          alt={business.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Deals Badge */}
        {hasDeals && (
          <div className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-orange-500  text-white px-3 py-1 rounded-lg font-bold text-sm flex items-center gap-1 shadow-lg">
            <Tag className="w-4 h-4" />
            DEALS
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleFavorite(business.id)
          }}
          className="group absolute top-3 right-3 bg-background/90 backdrop-blur rounded-lg hover:bg-primary/20 transition-all  flex items-center hover:scale-150 p-2"
        >
          <Heart className={`w-5 h-5 transition-colors ${isFavorited ? "fill-red-500 text-red-500" : ""}`} />

      </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-[rgb(30,30,30)] text-foreground text-lg group-hover:text-primary transition-colors">
              {business.name}
            </h3>
            <p className="flex justify-start text-sm text-gray-600 text-muted-foreground">{business.category}</p>
          </div>
        </div>

        <p className="flex justify-start text-sm text-muted-foreground text-left text-gray-600 mb-4 line-clamp-2">{business.description}</p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-primary text-green-700 text-primary" />
            <span className="font-semibold text-foreground text-black">{rating?.toFixed(1)}</span>
            <span className="text-muted-foreground text-black">({business.review_count})</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-4 h-4 text-green-700" />
            <span className="text-green-700">{business.distance}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

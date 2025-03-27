"use client"

import type React from "react"

import { useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
    value: number
    onChange: (rating: number) => void
    count?: number
    size?: number
    label?: string
    required?: boolean
}

const StarRating: React.FC<StarRatingProps> = ({
    value,
    onChange,
    count = 5,
    size = 24,
    label = "Rating",
    required = false,
}) => {
    const [hoverRating, setHoverRating] = useState(0)

    return (
        <div className="w-full">
            <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
                <div className="flex items-center">
                    {Array.from({ length: count }).map((_, index) => {
                        const starValue = index + 1
                        const isFilled = (hoverRating || value) >= starValue

                        return (
                            <button
                                key={index}
                                type="button"
                                className={`p-1 focus:outline-none transition-colors duration-200 ${isFilled ? "text-yellow-400" : "text-gray-300"
                                    } hover:text-yellow-400`}
                                onMouseEnter={() => setHoverRating(starValue)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => onChange(starValue)}
                                aria-label={`Rate ${starValue} out of ${count} stars`}
                            >
                                <Star size={size} fill={isFilled ? "currentColor" : "none"} strokeWidth={1.5} />
                            </button>
                        )
                    })}
                    <span className="ml-2 text-sm text-gray-500">{value ? `${value}/${count}` : ""}</span>
                </div>
            </div>
        </div>
    )
}

export default StarRating


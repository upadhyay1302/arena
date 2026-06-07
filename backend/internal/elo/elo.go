package elo

import "math"

const (
DefaultRating = 1000.0
KFactor       = 32.0
)

// Expected returns the expected score for player A against player B.
func Expected(ratingA, ratingB float64) float64 {
return 1.0 / (1.0 + math.Pow(10, (ratingB-ratingA)/400.0))
}

// NewRatings returns updated ratings after a match.
// winner = "a" if A won, "b" if B won, "draw" for draw.
func NewRatings(ratingA, ratingB float64, winner string) (newA, newB float64) {
expA := Expected(ratingA, ratingB)
expB := Expected(ratingB, ratingA)

var scoreA, scoreB float64
switch winner {
case "a":
scoreA, scoreB = 1.0, 0.0
case "b":
scoreA, scoreB = 0.0, 1.0
default: // draw
scoreA, scoreB = 0.5, 0.5
}

newA = ratingA + KFactor*(scoreA-expA)
newB = ratingB + KFactor*(scoreB-expB)
return
}

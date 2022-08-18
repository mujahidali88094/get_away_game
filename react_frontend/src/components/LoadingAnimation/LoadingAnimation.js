import React from 'react'
import ThreeDot from '../animations/ThreeDot'

export default function LoadingAnimation({loading}) {
	return (
		loading? <ThreeDot /> : null
	)
}

import React from 'react'
import LoadingAnimation from '../LoadingAnimation/LoadingAnimation';

export default function Header({big}) {
	return (
		<div>
			<h3 style={{ display: 'inline-block', paddingRight: '20px'}}>Just Get Away</h3>
      <LoadingAnimation loading />
		</div>
	)
}

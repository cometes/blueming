import { css, keyframes } from '@emotion/react';
import { motion } from 'framer-motion';
import React from 'react';

// Meteor animation keyframes
const meteorAnimation = keyframes`
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: rotate(215deg) translateX(-500px);
    opacity: 0;
  }
`;

// Meteor component styles
const meteorStyles = css`
  position: absolute;
  height: 2px;
  width: 2px;
  transform: rotate(45deg);
  border-radius: 9999px;
  background-color: #64748b;
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1);
  animation: ${meteorAnimation} 5s linear infinite;

  &::before {
    content: '';
    position: absolute;
    top: 50%;
    height: 1px;
    width: 50px;
    transform: translateY(-50%);
    background: linear-gradient(to right, #64748b, transparent);
  }
`;

export interface MeteorsProps {
  number?: number;
  className?: string;
}

export const Meteors: React.FC<MeteorsProps> = ({
  number = 20,
  className = '',
}) => {
  const meteors = new Array(number).fill(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {meteors.map((_, idx) => {
        const meteorCount = number;
        // Calculate position to evenly distribute meteors across container width
        const position = idx * (800 / meteorCount) - 400; // Spread across 800px range, centered

        return (
          <span
            key={`meteor-${idx}`}
            css={[
              meteorStyles,
              css`
                top: -40px;
                left: ${position}px;
                animation-delay: ${Math.random() * 5}s;
                animation-duration: ${Math.floor(Math.random() * (10 - 5) + 5)}s;
              `,
            ]}
            className={className}
          />
        );
      })}
    </motion.div>
  );
};
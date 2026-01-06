import { useState } from "react";

export const useModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(prev => !prev);
  };
  const cancelModal = () => {
    setIsModalOpen(prev => !prev);
  };
  return {
    isModalOpen,
    setIsModalOpen,
    showModal,
    cancelModal
  };
};

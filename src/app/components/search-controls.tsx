import type { ChangeEvent, FC } from "react";

import getTypesenseClient from "../services/typesense";

import styles from "./search-controls.module.css";

interface ControlsProps {
  query: string;
  // areRefinementsExpanded: boolean;
  client: ReturnType<typeof getTypesenseClient>;
  // onFacetChange: (event: CustomEvent) => void;
  // onRangeChange: (event: CustomEvent) => void;
  // onToggleRefinementsExpanded: () => void;
  onInput: (event: CustomEvent) => void;
}

const SearchControls: FC<ControlsProps> = ({
  query,
//   areRefinementsExpanded,
//   client,
//   onFacetChange,
//   onRangeChange,
//   onToggleRefinementsExpanded,
  onInput,
}) => {
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const event = new CustomEvent("input", { detail: e.target.value });
    onInput(event);
  };

  return (
    <div className={styles.container}>
      <input 
        type="text" 
        value={query} 
        onChange={handleInputChange} 
        className={styles.input}
        placeholder="Мельник"
      />
    </div>
  );
};

export default SearchControls;
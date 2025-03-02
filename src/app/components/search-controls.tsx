import type { ChangeEvent, FC } from "react";
import getTypesenseClient from "../services/typesense";

interface ControlsProps {
  query: string;
  areRefinementsExpanded: boolean;
  client: ReturnType<typeof getTypesenseClient>;
  onFacetChange: (event: CustomEvent) => void;
  onRangeChange: (event: CustomEvent) => void;
  onToggleRefinementsExpanded: () => void;
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
    <div>
      <input type="text" value={query} onChange={handleInputChange} />
      {/* Add additional controls for facets and ranges if necessary */}
    </div>
  );
};

export default SearchControls;
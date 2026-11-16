import { ComboBox } from "@heroui/react/combo-box";

export function MaterialComboBoxControl({
  placeholder,
}: {
  placeholder: string;
}) {
  return (
    <ComboBox.InputGroup className="min-h-9 w-full overflow-hidden rounded-xl border-0 bg-gray-100 shadow-none transition-colors focus-within:bg-gray-100 focus-within:ring-2 focus-within:ring-gray-300">
      <ComboBox.Value
        className="min-h-9 flex-1 border-0 bg-transparent px-3 py-2 text-sm outline-none focus:ring-0"
        placeholder={placeholder}
      />
      <ComboBox.Trigger className="min-h-9 shrink-0 px-3 text-gray-500" />
    </ComboBox.InputGroup>
  );
}

import { Button } from '../atoms/button';
import { Input } from '../atoms/input';

type Props = { label: string; defaultValue?: string; onSearch: (value: string) => void };

// Figma: Search box. Searches on submit (Enter or button), so there is no debounce to tune.
export const SearchBox = ({ defaultValue = '', label, onSearch }: Props) => (
  <search>
    <form
      className="flex gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch(String(new FormData(event.currentTarget).get('q') ?? '').trim());
      }}
    >
      <Input
        aria-label={label}
        defaultValue={defaultValue}
        name="q"
        placeholder={label}
        type="search"
      />
      <Button trackId="search-box.submit" type="submit" variant="secondary">
        Buscar
      </Button>
    </form>
  </search>
);

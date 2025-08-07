
// src/components/address-autocomplete.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Wrapper, Status } from "@googlemaps/react-wrapper";

const render = (status: Status) => {
  if (status === Status.FAILURE) return <div>Error loading map services.</div>;
  return null;
};

interface AutocompleteInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onPlaceSelect: (place: google.maps.places.PlaceResult) => void;
  placeholder?: string;
  id?: string;
}

function AutocompleteInputComponent({ value, onChange, onPlaceSelect, placeholder, id }: AutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    if (inputRef.current && !autocompleteRef.current) {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['address'],
        // This can be customized to a specific country if needed, e.g., { country: 'pk' }
        componentRestrictions: undefined,
      });
      autocompleteRef.current = autocomplete;

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
            onPlaceSelect(place);
        }
      });
    }
  }, [onPlaceSelect]);

  return <Input ref={inputRef} id={id} value={value} onChange={onChange} placeholder={placeholder} />;
}

export function AddressAutocompleteInput(props: AutocompleteInputProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error("Google Maps API Key is missing.");
    return <Input {...props} disabled placeholder="Maps API key missing" />;
  }

  return (
    <Wrapper apiKey={apiKey} libraries={['places']} render={render}>
      <AutocompleteInputComponent {...props} />
    </Wrapper>
  );
}

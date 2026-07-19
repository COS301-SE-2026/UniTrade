import { MapContainer, TileLayer, Marker, useMapEvents} from 'react-leaflet'
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

interface IconDefaultPrototype {
    _getIconUrl?: string;
}
delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;
L.Icon.Default.mergeOptions({
   iconRetinaUrl: markerIcon2x,
   iconUrl: markerIcon,
   shadowUrl: markerShadow,
});

const default_center: [number, number] = [-25.7545, 28.2314];
const default_zoom = 50;

interface LocationPickerProps {
    value: { lat: number; lng: number} | null;
    onChange?: (coords: { lat:number; lng: number}) => void;
    center?: [number, number];
    height?: number;
    readOnly?: boolean;
}

function ClickHandler({
    onChange,
    readOnly,
}: {
    onChange?: (coords: { lat:number; lng:number}) => void;
    readOnly?: boolean;
}) {
    useMapEvents({
        click(e) {
            if (readOnly || !onChange) return;
            onChange({ lat: e.latlng.lat, lng: e.latlng.lng});
        },
    });
    return null;
}

export default function LocationPicker({
    value,
    onChange,
    center = default_center,
    height = 400,
    readOnly = false,
}: LocationPickerProps) {
    return (
        <div className="isolate rounded-2xl overflow-hidden border border-gray-200" style={{height}}>
            <MapContainer
             center={value ? [value.lat, value.lng] : center}
             zoom={default_zoom}
             style={{height: '100%', width: '100%'}}
             dragging={!readOnly}
             scrollWheelZoom={!readOnly}
             doubleClickZoom={!readOnly}
             >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickHandler onChange={onChange} readOnly={readOnly} />
                {value && <Marker position={[value.lat, value.lng]} />}
             </MapContainer>
        </div>
    );
}
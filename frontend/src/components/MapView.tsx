import { useRef, useEffect } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'
import esriConfig from '@arcgis/core/config'
import '@arcgis/core/assets/esri/themes/light/main.css'
import { useFilteredBusinesses } from '@/hooks/useFilteredBusinesses'
import Point from '@arcgis/core/geometry/Point'
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol'

esriConfig.apiKey = import.meta.env.VITE_ARCGIS_API_KEY
console.log(
    'API key loaded:',
    Boolean(import.meta.env.VITE_ARCGIS_API_KEY)
)
const MapView_ = () => {
    const { data, loading, error } = useFilteredBusinesses()
    const mapDivRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<MapView | null>(null)
    const graphicsLayerRef = useRef<GraphicsLayer | null>(null)

    // Effect 1: create the Map + MapView ONCE on mount, destroy on unmount

    useEffect(() => {
        const graphicsLayer = new GraphicsLayer({
            id: "my-custom-graphics-layer",
            title: 'Custom Graphics'
        })

        const map = new Map({
            basemap: 'streets-navigation-vector'
        })

        map.add(graphicsLayer)

        console.log('Container:', {
        width: mapDivRef.current?.clientWidth,
        height: mapDivRef.current?.clientHeight,
        })

        console.log(
        'Parent width:',
        mapDivRef.current?.parentElement?.clientWidth
        )

        const view = new MapView({
            container: mapDivRef.current!,
            center: [-121, 46],
            map: map,
            zoom: 6
        })

        graphicsLayerRef.current = graphicsLayer
        viewRef.current = view

        view.when(() => {
        view.container = mapDivRef.current!
        })

        console.log('Map size:', view.size)
        
        return () => {
            view.destroy()
        }
    }, [])

    // Effect 2: whenever `data` changes, clear + redraw graphics — map itself untouched
    useEffect(() => {
        // guard: if graphicsLayerRef.current isn't ready yet, bail
        // graphicsLayer.removeAll()
        // for each business in `data` with non-null lat/lng, build a Graphic (Point geometry) and addMany() them
        if (!graphicsLayerRef.current) {
            return        
        }
        graphicsLayerRef.current. removeAll()

        const graphics = data.flatMap((business) => {
            if (business.lat === null || business.lng === null) {
                return []
            }
            const point = new Point({
                latitude: business.lat,
                longitude: business.lng,
            })

            let color = 'pink'
            if (business.category === 'Dispensaries') {
                color = 'pink'
            } else if (business.category === 'Hydroponics') {
                color = 'purple'
            }

            const symbol = new SimpleMarkerSymbol({
                size: 10,
                color: color
            })

            const graphic = new Graphic({
                geometry: point,
                symbol: symbol,
            })

            return [graphic]
        })
        graphicsLayerRef.current.addMany(graphics)

    }, [data])

    return <div ref={mapDivRef} style={{ height: '100%', width: '100%', position: 'relative' }} />
}

export default MapView_
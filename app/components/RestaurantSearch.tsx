'use client';

import { useEffect, useState, useCallback } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import OpenAI from 'openai';

interface MenuInfo {
  description: string;
}

type CuisineType = '전체' | '한식' | '일식' | '중식' | '양식' | '분식';

const defaultLocation = {
  lat: 37.560843,
  lng: 126.975881
};

const mapContainerStyle = {
  width: '100%',
  height: '400px'
};

const libraries: ("places")[] = ["places"];

export default function RestaurantSearch() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: libraries,
  });

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.log('Google Maps API Key:', process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.slice(0, 5) + '...');
    } else {
      console.error('Google Maps API Key is not set');
    }
    
    if (process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.log('OpenAI API Key:', process.env.NEXT_PUBLIC_OPENAI_API_KEY.slice(0, 5) + '...');
    } else {
      console.error('OpenAI API Key is not set');
    }
  }, []);

  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(500);
  const [selectedCuisine, setSelectedCuisine] = useState<CuisineType>('전체');
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [menuInfo, setMenuInfo] = useState<MenuInfo | null>(null);

  const getMenuInfo = useCallback(async (place: any) => {
    try {
      console.log('Getting menu info for:', place.name);
      const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
        dangerouslyAllowBrowser: true
      });

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "당신은 한국의 맛집 전문가입니다. 주어진 식당 정보를 바탕으로 메뉴와 특징을 설명해주세요."
          },
          {
            role: "user",
            content: `식당 이름: ${place.name}\n종류: ${place.types?.[0] || 'restaurant'}\n선택된 카테고리: ${selectedCuisine}`
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      console.log('OpenAI response:', response.choices[0]?.message?.content);

      if (response.choices[0]?.message?.content) {
        setMenuInfo({
          description: response.choices[0].message.content
        });
      }
    } catch (error) {
      console.error('메뉴 정보 가져오기 실패:', error);
      setError('메뉴 정보를 가져오는데 실패했습니다.');
    }
  }, [selectedCuisine]);

  const searchRandomRestaurant = useCallback(async () => {
    if (!map) {
      console.error('Map is not initialized');
      setError('지도가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
      return;
    }

    if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API Key is not set');
      setError('Google Maps API Key가 설정되지 않았습니다.');
      return;
    }

    if (!process.env.NEXT_PUBLIC_OPENAI_API_KEY) {
      console.error('OpenAI API Key is not set');
      setError('OpenAI API Key가 설정되지 않았습니다.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setRestaurant(null);
      setMenuInfo(null);
      
      const service = new google.maps.places.PlacesService(map);
      
      const request = {
        location: defaultLocation,
        radius: searchRadius,
        type: 'restaurant',
        keyword: selectedCuisine === '전체' ? undefined : selectedCuisine
      };

      console.log('Search request:', request);

      service.nearbySearch(request, async (results, status) => {
        console.log('Places API response status:', status);
        console.log('Number of results:', results?.length);
        
        if (status === google.maps.places.PlacesServiceStatus.OK && results && results.length > 0) {
          // 평점 있는 식당들 중에서 랜덤 선택
          const ratedRestaurants = results.filter(place => place.rating);
          if (ratedRestaurants.length === 0) {
            setError('검색 결과가 없습니다. 다른 검색 조건을 시도해보세요.');
            return;
          }

          const randomIndex = Math.floor(Math.random() * ratedRestaurants.length);
          const selectedPlace = ratedRestaurants[randomIndex];

          // place_id가 없는 경우 에러 처리
          if (!selectedPlace.place_id) {
            setError('선택된 식당의 정보가 올바르지 않습니다.');
            setLoading(false);
            return;
          }

          // 상세 정보 가져오기
          service.getDetails(
            {
              placeId: selectedPlace.place_id,
              fields: ['name', 'rating', 'formatted_address', 'photos', 'price_level', 'reviews', 'website', 'formatted_phone_number', 'types', 'vicinity']
            },
            async (detailedPlace, detailedStatus) => {
              if (detailedStatus === google.maps.places.PlacesServiceStatus.OK) {
                const result = {
                  ...selectedPlace,
                  details: detailedPlace
                };
                setRestaurant(result);
                await getMenuInfo(result);
              } else {
                setError('식당 정보를 가져오는데 실패했습니다.');
              }
            }
          );
        } else {
          console.error('Search failed:', status);
          setError('검색 결과가 없습니다. 다른 검색 조건을 시도해보세요.');
        }
      });
    } catch (error) {
      console.error('Search error:', error);
      setError('검색 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [map, searchRadius, selectedCuisine, getMenuInfo]);

  if (loadError) {
    console.error('Google Maps load error:', loadError);
    return <div className="p-4 text-red-500">지도를 불러오는데 실패했습니다.</div>;
  }
  if (!isLoaded) return <div className="p-4">지도를 불러오는 중...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">회사주변 랜덤 맛집 추천</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap">검색 반경:</label>
            <input
              type="number"
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              onBlur={() => {
                if (searchRadius < 100) setSearchRadius(100);
                if (searchRadius > 5000) setSearchRadius(5000);
              }}
              className="border rounded px-2 py-1 w-24"
              placeholder="500"
              min="100"
              max="5000"
              step="100"
            />
            <span className="whitespace-nowrap">미터 (100~5000m)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap">음식 종류:</label>
            <select
              value={selectedCuisine}
              onChange={(e) => {
                setSelectedCuisine(e.target.value as CuisineType);
                setRestaurant(null);
                setMenuInfo(null);
              }}
              className="border rounded px-2 py-1"
            >
              <option value="전체">전체</option>
              <option value="한식">한식</option>
              <option value="일식">일식</option>
              <option value="중식">중식</option>
              <option value="양식">양식</option>
              <option value="분식">분식</option>
            </select>
          </div>

          <button
            onClick={searchRandomRestaurant}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? '검색 중...' : '랜덤 맛집 찾기'}
          </button>
        </div>

        {error && (
          <div className="text-red-500 text-sm mt-2">
            {error}
          </div>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={restaurant?.geometry?.location || defaultLocation}
          zoom={16}
          onLoad={setMap}
        >
          {restaurant && (
            <Marker
              position={restaurant.geometry.location}
            />
          )}
        </GoogleMap>
      </div>

      {restaurant && menuInfo && (
        <div className="border p-4 rounded-lg shadow">
          <div className="flex justify-between items-start">
            <div className="space-y-2 flex-1">
              <h2 className="text-xl font-semibold">
                {restaurant.name}
              </h2>
              <p className="text-gray-600">{restaurant.vicinity}</p>
              <p className="text-yellow-500">
                {'★'.repeat(Math.round(restaurant.rating))}
                <span className="text-gray-600 ml-1">({restaurant.rating})</span>
              </p>
              <p className="text-gray-600">
                가격대: {'₩'.repeat(restaurant.price_level || 1)}
              </p>
              {restaurant.details?.formatted_phone_number && (
                <p className="text-gray-600">
                  전화: {restaurant.details.formatted_phone_number}
                </p>
              )}
              <div className="mt-4 bg-white p-4 rounded-lg border">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-800 leading-relaxed">
                    {menuInfo.description}
                  </p>
                </div>
              </div>
            </div>
            {restaurant.photos?.[0] && (
              <img
                src={restaurant.photos[0].getUrl()}
                alt={restaurant.name}
                className="w-32 h-32 object-cover rounded ml-4"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
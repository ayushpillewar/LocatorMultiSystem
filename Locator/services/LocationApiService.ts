import { API_BASE_URL } from "../constants/const";   
import { Location } from "../dto/models";


export class LocationApiService {
    private static instance: LocationApiService
    private apiBaseUrl: string;
    
    private constructor() {
        this.apiBaseUrl = API_BASE_URL;
    }

    public static getInstance(): LocationApiService {
        if (!LocationApiService.instance) {
            LocationApiService.instance = new LocationApiService();
        }
        return LocationApiService.instance;
    }
    
    async sendLocation(locationData: Location, token?: string): Promise<void> {
        try {
            console.log('📍 [LocationApiService] Sending location:', locationData);
            const headers: Record<string, string> = {
                 'Content-Type': 'application/json'
                
                };
            if (token) headers['Authorization'] = `Bearer ${token}`;
            console.log('📍 [LocationApiService] Request headers:', headers);
            const response = await fetch(`${this.apiBaseUrl}/location`, {
                method: 'POST',
                headers,
                body: JSON.stringify(locationData),
            });

            if (!response.ok) {
                console.error('API responded with status:', response.status);
            }
            console.log('📍 [LocationApiService] Location sent successfully');
        } catch (error) {
            console.error('Failed to send location:', error);
        }
    }

    async getLocationHistory(token?: string): Promise<Location[]> {
        try {
            console.log('📍 [LocationApiService] Fetching location history...');
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${this.apiBaseUrl}/location`, {
                method: 'GET',
                headers,
            });
            
            if (response.ok) {
                const data = await response.json();
                console.log('📍 [LocationApiService] Fetched location history:', data);
                return data as Location[];
            } else {
                console.error('API responded with status:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Failed to fetch location history:', error);
            return [];      
        }
    }
}
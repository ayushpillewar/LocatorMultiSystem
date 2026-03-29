import { API_BASE_URL } from "../constants/const";   
import { Location, SubscriptionRequestBody, User } from "../dto/models";


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

    async checkSubscription(userId: string, token?: string): Promise<User | null> {
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${this.apiBaseUrl}/subscribe?userId=${userId}`, {
                method: 'GET',
                headers,
            });

            if (response.ok) {
                const data = await response.json();
                return data as User;
            } else {
                console.error('[LocationApiService] checkSubscription responded with status:', response.status);
                return new User(userId, '', '', '', '');
            }
        } catch (error) {
            console.error('[LocationApiService] Failed to check subscription:', error);
            return new User(userId, '', '', '', '');
        }
    }

    async subscribeToService(subscriptionData: SubscriptionRequestBody, token?: string): Promise<void> {
        try {
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(`${this.apiBaseUrl}/subscribe`, {
                method: 'PUT',
                headers,
                body: JSON.stringify(subscriptionData),
            }); 

            if (!response.ok) {
                console.error('[LocationApiService] subscribeToService responded with status:', response.status);
            } else {
                console.log('[LocationApiService] Subscription successful');
            }
        } catch (error) {
            console.error('[LocationApiService] Failed to subscribe to service:', error);
        }  

    }
}
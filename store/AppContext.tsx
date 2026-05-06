
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Event, Article, UserRole } from '../types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  viewAsAttendee: boolean;
  setViewAsAttendee: (v: boolean) => void;
  events: Event[];
  setEvents: (events: Event[]) => void;
  articles: Article[];
  setArticles: (articles: Article[]) => void;
  users: User[];
  setUsers: (users: User[]) => void;
  joinEvent: (eventId: string) => Promise<{ success: boolean; message: string }>;
  createEvent: (eventData: Partial<Event>) => void;
  blockEvent: (eventId: string) => void;
  blockUser: (userId: string) => void;
  clapArticle: (articleId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('timematter_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [viewAsAttendee, setViewAsAttendee] = useState(false);

  const [users, setUsers] = useState<User[]>([
    { id: '1', name: 'Super Admin', email: 'admin@timematter.club', role: UserRole.SUPER_ADMIN, isBlocked: false, joinedEvents: [] },
    { id: '2', name: 'Elder Care Org', email: 'org@care.com', role: UserRole.ORGANIZER, isBlocked: false, joinedEvents: [] },
    { id: '3', name: 'John Doe', email: 'john@example.com', role: UserRole.USER, isBlocked: false, joinedEvents: [] },
  ]);

  const [events, setEvents] = useState<Event[]>([
    { id: 'e1', title: 'Gentle Yoga for Seniors', description: 'A relaxing yoga session designed for elders to improve flexibility and mindfulness.', bannerUrl: 'https://picsum.photos/id/28/800/400', dateTime: '2024-05-20 10:00 AM', location: 'Central Park', category: 'Health', organizerId: '2', organizerName: 'Elder Care Org', isBlocked: false, joinedCount: 15 },
    { id: 'e2', title: 'Community Tea Party', description: 'Socialize over high tea and traditional snacks.', bannerUrl: 'https://picsum.photos/id/42/800/400', dateTime: '2024-05-22 03:00 PM', location: 'Community Center', category: 'Social', organizerId: '2', organizerName: 'Elder Care Org', isBlocked: false, joinedCount: 8 },
    { id: 'e3', title: 'Beginners Painting Workshop', description: 'Discover your inner artist in this peaceful workshop.', bannerUrl: 'https://picsum.photos/id/50/800/400', dateTime: '2024-05-25 09:00 AM', location: 'Art Gallery A', category: 'Creative', organizerId: '2', organizerName: 'Elder Care Org', isBlocked: false, joinedCount: 12 },
    { id: 'e4', title: 'Memory Training Workshop', description: 'Engaging brain exercises to keep the mind sharp.', bannerUrl: 'https://picsum.photos/id/60/800/400', dateTime: '2024-06-01 11:00 AM', location: 'Library Annex', category: 'Education', organizerId: '2', organizerName: 'Elder Care Org', isBlocked: false, joinedCount: 20 },
    { id: 'e5', title: 'Walking Football Match', description: 'Stay active with a friendly game of walking football.', bannerUrl: 'https://picsum.photos/id/70/800/400', dateTime: '2024-06-05 08:30 AM', location: 'Local Stadium', category: 'Sports', organizerId: '2', organizerName: 'Elder Care Org', isBlocked: false, joinedCount: 25 },
    { id: 'e6', title: 'Traditional Craft Session', description: 'Learn the art of weaving and pottery.', bannerUrl: 'https://picsum.photos/id/80/800/400', dateTime: '2024-06-10 02:00 PM', location: 'Craft Center', category: 'Creative', organizerId: '2', organizerName: 'Elder Care Org', isBlocked: false, joinedCount: 5 },
    { id: 'e7', title: 'Retirement Finance Talk', description: 'Expert advice on managing your pensions and investments.', bannerUrl: 'https://picsum.photos/id/90/800/400', dateTime: '2024-06-15 01:00 PM', location: 'Financial Hub', category: 'Education', organizerId: '2', organizerName: 'Elder Care Org', isBlocked: false, joinedCount: 30 },
  ]);

  const [articles, setArticles] = useState<Article[]>([
    { id: 'a1', title: '5 Benefits of Morning Walks', content: 'Morning walks are essential for heart health and mental clarity...', imageUrl: 'https://picsum.photos/id/10/400/250', author: 'Dr. Smith', claps: 120, date: '2024-04-10' },
    { id: 'a2', title: 'Healthy Recipes for 60+', content: 'Nutrition needs change as we age. Here are some delicious ideas...', imageUrl: 'https://picsum.photos/id/20/400/250', author: 'Chef Maria', claps: 85, date: '2024-04-15' },
    { id: 'a3', title: 'Staying Social in Retirement', content: 'Connection is key to longevity. Find out how to stay engaged...', imageUrl: 'https://picsum.photos/id/30/400/250', author: 'James Bond', claps: 210, date: '2024-04-20' },
  ]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('timematter_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('timematter_user');
    }
  }, [currentUser]);

  const joinEvent = async (eventId: string) => {
    if (!currentUser) {
      return { success: false, message: 'Please login to join the event' };
    }
    if (currentUser.joinedEvents.includes(eventId)) {
      return { success: false, message: 'You have already joined this event' };
    }

    const updatedUser = { ...currentUser, joinedEvents: [...currentUser.joinedEvents, eventId] };
    setCurrentUser(updatedUser);
    
    setEvents(prev => prev.map(ev => 
      ev.id === eventId ? { ...ev, joinedCount: ev.joinedCount + 1 } : ev
    ));

    return { success: true, message: `Success! Your free ticket for event #${eventId} has been sent to ${currentUser.email}.` };
  };

  const createEvent = (eventData: Partial<Event>) => {
    const newEvent: Event = {
      id: Math.random().toString(36).substr(2, 9),
      title: eventData.title || 'Untitled Event',
      description: eventData.description || '',
      bannerUrl: eventData.bannerUrl || 'https://picsum.photos/800/400',
      dateTime: eventData.dateTime || new Date().toLocaleString(),
      location: eventData.location || 'Online',
      category: eventData.category || 'General',
      organizerId: currentUser?.id || '2',
      organizerName: currentUser?.name || 'Organizer',
      isBlocked: false,
      joinedCount: 0,
    };
    setEvents(prev => [newEvent, ...prev]);
  };

  const blockEvent = (eventId: string) => {
    setEvents(prev => prev.map(ev => ev.id === eventId ? { ...ev, isBlocked: !ev.isBlocked } : ev));
  };

  const blockUser = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !u.isBlocked } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, isBlocked: !prev.isBlocked } : null);
    }
  };

  const clapArticle = (articleId: string) => {
    setArticles(prev => prev.map(art => art.id === articleId ? { ...art, claps: art.claps + 1 } : art));
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser,
      viewAsAttendee, setViewAsAttendee,
      events, setEvents,
      articles, setArticles,
      users, setUsers,
      joinEvent, createEvent, blockEvent, blockUser, clapArticle
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

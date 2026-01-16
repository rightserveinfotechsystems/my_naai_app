
import React, { createContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { getServerUrl, communication } from '../services/communication';

export const NotificationContext = createContext();

let globalSocket = null;

export const NotificationProvider = ({ children, userId }) => {
    const [count, setCount] = useState(0);
    const [list, setList] = useState([]);

    useEffect(() => {
        let isMounted = true;
        loadNotifications();

        // Disconnect previous socket if exists
        if (globalSocket) {
            globalSocket.disconnect();
            globalSocket = null;
        }

        // Create global socket connection
        globalSocket = io(getServerUrl(), {
            transports: ['websocket'],
            query: { userId },
        });

        globalSocket.on('connect', () => {
            console.log('Global socket connected (NotificationContext)');
        });

        globalSocket.on('new_notification', (notification) => {
            if (!isMounted) return;
            setCount(prev => prev + 1);
            setList(prev => [notification, ...prev]);
        });

        return () => {
            isMounted = false;
            if (globalSocket) {
                globalSocket.disconnect();
                globalSocket = null;
            }
        };
    }, [userId]);

    const loadNotifications = async () => {
        console.log('loadNotifications userId:', userId);

        try {
            const cRes = await communication.userNotificationCount({ userId });
            const lRes = await communication.userNotificationList({ userId });
            console.log("cRes", cRes?.notification);
            console.log("lRes", lRes?.data?.notifications);

            setCount(cRes?.notification || 0);
            setList(lRes?.data?.notifications || []);
        } catch (e) {
            setCount(0);
            setList([]);
        }
    };

    return (
        <NotificationContext.Provider value={{ count, list }}>
            {children}
        </NotificationContext.Provider>
    );
};


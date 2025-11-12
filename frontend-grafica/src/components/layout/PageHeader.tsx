"use client"; 

import { Bell, User } from "lucide-react";
import UserMenu from "./UserMenu"; 
import NotificationBell from "./NotificationBell"; 

type PageHeaderProps = {
  title: string;
};

export default function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
      <div className="flex items-center gap-4">
        
        {/* <button className="text-gray-500 hover:text-gray-800">
          <Bell size={24} />
        </button> */}
        
        <NotificationBell />
        
        <UserMenu /> 
      </div>
    </header>
  );
}
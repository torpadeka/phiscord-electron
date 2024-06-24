import React, { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { withAuth } from "@/hoc/withAuth";
import GeneralSettings from "@/components/phiscord/GeneralSettings";

const SettingsPage = () => {
    return (
        <div className="fade-in dark w-screen h-screen flex items-center justify-center">
            <Tabs defaultValue="general" className="w-3/4 h-5/6">
                <TabsList className="gap-6">
                    <TabsTrigger className="text-xl" value="general">
                        General
                    </TabsTrigger>
                    <TabsTrigger className="text-xl" value="privacy">
                        Privacy
                    </TabsTrigger>
                </TabsList>
                <TabsContent className="w-full flex flex-col" value="general">
                    <GeneralSettings />
                </TabsContent>
                <TabsContent className="w-full flex flex-col" value="privacy">
                    Change Privacy Settings Here.
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default withAuth(SettingsPage);

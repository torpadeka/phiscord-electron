"use client";

import { firestore, storage } from "../../../firebase/clientApp";
import firebase from "../../../firebase/clientApp";
import type { Auth } from "firebase/auth";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { Button } from "../ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { useRouter } from "next/router";
import { Input } from "../ui/input";

// Utilizing shadcnui's form component

const formSchema = z.object({
    username: z
        .string()
        .min(2, { message: "Username must at least be 2 characters" })
        .max(20, { message: "Username can only be 20 characters at max" }),
    tag: z
        .string()
        .min(4, { message: "Tag must at least be 4 chatacters" })
        .max(5, { message: "Tag can only be 5 characters at max" }),
});

const createNewuser = async (username, tag) => {
    console.log("createNewuser called"); // Logging to verify function call
    const auth = firebase.auth() as unknown as Auth;
    const { uid } = auth.currentUser;
    const usersRef = firestore.collection("users");

    const profilePicture = await storage.ref().child("phiscord_default_pfp.PNG").getDownloadURL();

    // Do something with the form values.
    // ✅ This will be type-safe and validated.
    await usersRef.doc(uid).set({
        uid: uid,
        username: username,
        tag: tag,
        status: null,
        profilePicture: profilePicture,
    });
};

const NewUserPrompt = () => {
    const [userCreated, setUserCreated] = useState(false);
    const router = useRouter();

    const usernameForm = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            username: "",
            tag: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        await createNewuser(values.username, values.tag);
        setUserCreated(true);
    }

    const redirectHome = () => {
        router.push("/home");
    };

    return (
        <>
            {!userCreated && (
                <Form {...usernameForm}>
                    <form
                        onSubmit={usernameForm.handleSubmit(onSubmit)}
                        className="fade-in space-y-8"
                    >
                        <FormField
                            control={usernameForm.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Username</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="AwesomeUser"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This is your displayed username.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={usernameForm.control}
                            name="tag"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tag</FormLabel>
                                    <FormControl>
                                        <Input placeholder="0000" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        This is your username's tag.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button className="w-full" type="submit">
                            Submit
                        </Button>
                    </form>
                </Form>
            )}
            {userCreated && (
                <div className="fade-in flex flex-col items-center justify-center gap-4">
                    <div className="text-green-500 font-bold">
                        User Information Saved!
                    </div>
                    <Button onClick={redirectHome}>Proceed to PHiscord</Button>
                </div>
            )}
        </>
    );
};

export default NewUserPrompt;

import { NextResponse } from 'next/server';
import { database } from '@/config/database'; 
import { usersTable } from '@/config/userSchema'; 
import { eq } from 'drizzle-orm';

/**
 * Handles the POST request to create a new user profile in the secondary database.
 * This route is called immediately after a successful Firebase sign-up/sign-in
 * to synchronize the user record.
 * * URL Path: /api/user-create
 */
export async function POST(request: Request) {
    try {
        // We expect the email and name, which are passed from the SignUp component.
        const { email, name } = await request.json();

        if (!email || !name) {
            console.warn('DB Creation Attempt Failed: Missing email or name.');
            return NextResponse.json({ error: 'Missing email or name in request body' }, { status: 400 });
        }

        //  Check if the user already exists using the unique email address
        const existingUsers = await database.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
        
        if (existingUsers.length > 0) {
            
            console.log(` Secondary DB: User profile already exists for email: ${email}`);
            return NextResponse.json({ message: 'User profile already exists' }, { status: 200 });
        }

        // Insert the new user into the usersTable
        const newUser = await database.insert(usersTable).values({
            email: email,
            name: name,
        }).returning({
            id: usersTable.id,
            email: usersTable.email,
        });

        if (newUser.length === 0) {
            throw new Error("Drizzle failed to return the inserted user record.");
        }

        console.log(` Secondary DB: User profile created for email: ${email}, ID: ${newUser[0].id}`);

        return NextResponse.json({ 
            message: 'User profile created successfully', 
            userId: newUser[0].id 
        }, { status: 201 });

    } catch (error) {
        console.error(' DB Creation Error:', error);
        
        // Return a 500 status code for internal server errors
        return NextResponse.json(
            { error: 'Failed to create user profile in secondary database.' }, 
            { status: 500 }
        );
    }
}

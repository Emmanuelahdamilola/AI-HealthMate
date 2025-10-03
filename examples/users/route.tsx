// import { database } from "@/config/database";
// import { usersTable } from "@/config/userSchema";
// import { currentUser } from "@clerk/nextjs/server";
// import { eq } from "drizzle-orm";
// import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   const user = await currentUser();

//   try {
//     // check if user already exist
//     const users = await database.select().from(usersTable)
//       // @ts-ignore
//       .where(eq(usersTable.email, user?.primaryEmailAddress?.emailAddress));

//     // if not, create new user
//     if (users?.length == 0) {
//       const result = await database.insert(usersTable).values({
//         // @ts-ignore
//         name: user?.fullName,
//         email: user?.primaryEmailAddress?.emailAddress,

//         // @ts-ignore
//       }).returning({ usersTable })
//       return NextResponse.json(result[0]?.userTable);
//     }

//     return NextResponse.json(users[0]);
//   } catch (e) {
//     return NextResponse.json(e);
//   }
// }

// export async function GET(req:NextRequest){
//   const { searchParams } = new URL(req.url);
//   const sessionId = searchParams.get("sessionId");
//   const user = await currentUser();

//   try {
//     // Fetch session details from an API or database
//     // @ts-ignore
//     const session = await database.select().from(SessionsChatTable)
//       // @ts-ignore
//       .where(eq(SessionsChatTable.sessionId, sessionId))
//       // @ts-ignore
//       .andWhere(eq(SessionsChatTable.userId, user?.id));

//     if (!session) {
//       return NextResponse.json({ error: "Session not found" }, { status: 404 });
//     }

//     return NextResponse.json(session[0]);
//   } catch (e) {
//     return NextResponse.json(e);
//   }
// }
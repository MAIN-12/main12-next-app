# Main 12 Support Component

A comprehensive support component for Next.js applications that provides a user-friendly interface for customer support interactions, including chat, ticket creation, and knowledge base access.

## Features

- Interactive support chat interface
- Ticket creation and management
- Knowledge base integration
- Customizable UI elements
- Internationalization support
- Authentication integration


## Integrating the Support Component

To integrate the support component into your project, follow these steps:

### 1. Install Dependencies
Ensure all necessary dependencies are installed for the component to function correctly.
```bash
npm install @heroui/react framer-motion
# or
yarn add @heroui/react framer-motion
```

### 2. Add the Component
Place the `feedback` folder inside your `components` directory.

### 3. Use the Component
Import and include `<SupportModal />` wherever you want to display the feedback modal button.

### 4. Configure as Needed
Adjust the implementation according to your project's requirements.

By following these steps, you’ll seamlessly integrate the support component into your project.

## Optional Dependencies
### localization Provider
To manage language localization, it is recommended to use next-intl:

```bash
npm install next-intl
```

Alternatively, you can edit the translation in the getTranslation.js file inside the locale folder if you want to use a different localization provider.

### Auth Provider
For user authentication, it is recommended to use @auth0/nextjs-auth0:

```bash
npm install @auth0/nextjs-auth0
```

If you want to use a different authentication provider, you can modify the implementation inside the auth folder.
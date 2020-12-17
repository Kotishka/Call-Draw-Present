import React from 'react';
import "../App.css";
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';

function CreateTodo() {
        return (
            <AmplifySignOut />
        )
}

export default withAuthenticator(CreateTodo);

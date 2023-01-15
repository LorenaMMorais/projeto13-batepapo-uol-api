import express, {json} from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;
app.use(cors());
app.use(json());


app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
}); 
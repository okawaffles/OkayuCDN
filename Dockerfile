FROM node:15
WORKDIR /okayuapp
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 2773
CMD ["npm", "start"]
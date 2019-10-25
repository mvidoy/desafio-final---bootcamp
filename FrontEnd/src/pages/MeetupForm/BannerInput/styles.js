import styled from 'styled-components';
import { darken } from 'polished';

export const Container = styled.div`
  background: ${darken(0.05, '#002288')};
  height: 300px;
  border-radius: 4px;
  margin: 20px 0;

  label {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;

    img {
      height: 320px;
      border-radius: 4px;
      display: flex;
      flex: 1;
    }

    div {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      span {
        color: #fff;
      }
    }

    input {
      display: none;
    }
  }

  span {
    color: #fb6f91;
    align-self: flex-start;
    margin: 0 0 10px;
    font-weight: bold;
  }
`;
